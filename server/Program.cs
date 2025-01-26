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

//builder.Services.AddCors(options =>
//{
//    options.AddPolicy("AllowFrontend", policy =>
//    {
//        policy.WithOrigins("http://localhost:5173") // React app URL
//              .AllowAnyHeader()
//              .AllowAnyMethod();
//    });
//    options.AddPolicy("AllowAnyOrigin",
//        policy =>
//        {
//            policy.AllowAnyOrigin()
//                  .AllowAnyHeader()
//                  .AllowAnyMethod();
//        });
//});

//if (builder.Environment.IsDevelopment())
//{
//    builder.WebHost.UseUrls("http://*:8080");  // HTTP for local development
//}
//else
//{
//    builder.WebHost.UseUrls("https://*:8081");  // HTTPS for production
//}

var app = builder.Build();


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseCors("AllowFrontend").UseCors("AllowAnyOrigin");
//app.UseHttpsRedirection();

//app.UseAuthorization();

//app.UseRouting();

app.MapControllers();

app.Run();

//app.Run("http://0.0.0.0:8080");  // HTTP
//app.Run("https://0.0.0.0:8081"); // HTTPS
