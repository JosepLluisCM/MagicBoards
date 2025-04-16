using Amazon;
using DotNetEnv;
using server.Services;
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
builder.Services.AddSingleton<FirestoreService>();
AWSConfigsS3.UseSignatureVersion4 = true;
builder.Services.AddSingleton<R2CloudflareService>();
builder.Services.AddSingleton<ImagesService>();
builder.Services.AddSingleton<CanvasesService>();



builder.Services.AddControllers()
    .AddJsonOptions(options => 
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAnyOrigin",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

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

app.UseCors("AllowAnyOrigin");
app.UseHttpsRedirection();

app.UseAuthorization();

//app.UseRouting();

app.MapControllers();

app.Run();

