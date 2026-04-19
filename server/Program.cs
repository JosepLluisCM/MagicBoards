using Amazon;
using DotNetEnv;
using Microsoft.AspNetCore.RateLimiting;
using Serilog;
using Serilog.Context;
using server.Services;
using server.Utilities;
using Server.Urilities;
using System.Diagnostics;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;

// Bootstrap logger catches startup errors before full config is loaded
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder(args);

// §31 Serilog — read config from appsettings (overridable per environment)
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext());

Env.Load();

// Validate required credentials at startup
var firestoreCredPath = Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS");
if (string.IsNullOrEmpty(firestoreCredPath) || !File.Exists(firestoreCredPath))
    throw new InvalidOperationException(
        $"GOOGLE_APPLICATION_CREDENTIALS is missing or the file does not exist: '{firestoreCredPath ?? "(not set)"}'");

var r2CredPath = Environment.GetEnvironmentVariable("R2_CREDENTIALS_PATH");
if (string.IsNullOrEmpty(r2CredPath) || !File.Exists(r2CredPath))
    Log.Warning("R2_CREDENTIALS_PATH is not properly configured");

// Register services
builder.Services.AddSingleton<FirebaseAdminService>();
builder.Services.AddSingleton<FirestoreService>();

AWSConfigsS3.UseSignatureVersion4 = true;
builder.Services.AddSingleton<R2CloudflareService>();

builder.Services.AddSingleton<ImagesService>();
builder.Services.AddSingleton<CanvasesService>();
builder.Services.AddSingleton<UsersService>();
builder.Services.AddSingleton<LogsService>();

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// §17 Rate limiting — sliding window on the login endpoint
builder.Services.AddRateLimiter(options =>
{
    options.AddSlidingWindowLimiter("login", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.SegmentsPerWindow = 4;
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// CORS policy
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
        options.AddPolicy("CorsPolicy", policy =>
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials()));
}
else
{
    var prodOrigin = Environment.GetEnvironmentVariable("ALLOWED_ORIGIN")
        ?? throw new InvalidOperationException("ALLOWED_ORIGIN environment variable is required in production");

    builder.Services.AddCors(options =>
        options.AddPolicy("CorsPolicy", policy =>
            policy.WithOrigins(prodOrigin)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials()));
}

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10 MB global limit
    serverOptions.ConfigureHttpsDefaults(options =>
    {
        options.SslProtocols = System.Security.Authentication.SslProtocols.Tls12 |
                               System.Security.Authentication.SslProtocols.Tls13;
    });
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseSerilogRequestLogging(); // §31 structured HTTP request logs

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("CorsPolicy");
app.UseHttpsRedirection();

// §33 Correlation IDs — push TraceId into every log entry for this request
app.Use(async (context, next) =>
{
    var traceId = Activity.Current?.TraceId.ToString() ?? context.TraceIdentifier;
    using (LogContext.PushProperty("TraceId", traceId))
    {
        await next();
    }
});

// §16 CSRF — reject mutating requests whose Origin doesn't match the CORS allow-list.
// Same-origin requests don't send an Origin header and are never a CSRF risk.
var allowedOrigins = app.Environment.IsDevelopment()
    ? new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "http://localhost:5173" }
    : new HashSet<string>(StringComparer.OrdinalIgnoreCase) { Environment.GetEnvironmentVariable("ALLOWED_ORIGIN") ?? "" };

app.Use(async (context, next) =>
{
    var method = context.Request.Method;
    if (!HttpMethods.IsGet(method) && !HttpMethods.IsHead(method) && !HttpMethods.IsOptions(method))
    {
        var origin = context.Request.Headers.Origin.FirstOrDefault();
        if (origin != null && !allowedOrigins.Contains(origin))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return;
        }
    }
    await next();
});

app.UseRateLimiter(); // §17

app.UseSessionAuth();

app.MapControllers();

app.Run();
