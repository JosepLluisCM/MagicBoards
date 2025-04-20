using Amazon;
using DotNetEnv;
using server.Services;
using server.Utilities;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

Env.Load();

// Validate Firestore credentials
var firestoreCredPath = Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS");
if (string.IsNullOrEmpty(firestoreCredPath) || !File.Exists(firestoreCredPath))
{
    Console.WriteLine("Warning: GOOGLE_APPLICATION_CREDENTIALS is not properly configured");
}

// Validate R2 credentials file
var r2CredPath = Environment.GetEnvironmentVariable("R2_CREDENTIALS_PATH");
if (string.IsNullOrEmpty(r2CredPath) || !File.Exists(r2CredPath))
{
    Console.WriteLine("Warning: R2_CREDENTIALS_PATH is not properly configured");
}

// Register FirestoreService as a singleton
builder.Services.AddSingleton<FirebaseAdminService>();
builder.Services.AddSingleton<FirestoreService>();

AWSConfigsS3.UseSignatureVersion4 = true;
builder.Services.AddSingleton<R2CloudflareService>();

builder.Services.AddSingleton<ImagesService>();
builder.Services.AddSingleton<CanvasesService>();
builder.Services.AddSingleton<UsersService>();



builder.Services.AddControllers()
    .AddJsonOptions(options => 
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();




// Add CORS policy based on environment
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("CorsPolicy",
            policy =>
            {
                policy.WithOrigins("http://localhost:5173")
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            });
    });
}
else
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("CorsPolicy",
            policy =>
            {
                policy.WithOrigins("https://your-production-domain.com")
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            });
    });
}

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    // Configure HTTPS
    serverOptions.ConfigureHttpsDefaults(options =>
    {
        options.SslProtocols = System.Security.Authentication.SslProtocols.Tls12 | 
                               System.Security.Authentication.SslProtocols.Tls13;
    });
});

var app = builder.Build();


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("CorsPolicy");
app.UseHttpsRedirection();

app.UseSessionAuth();

app.MapControllers();

app.Run();

