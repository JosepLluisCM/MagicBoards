using DotNetEnv;
using server.Services;

var builder = WebApplication.CreateBuilder(args);

Env.Load();

// Register FirestoreService as a singleton
builder.Services.AddSingleton<FirestoreService>();

builder.Services.AddControllers();
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

