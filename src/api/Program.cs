using Amazon.DynamoDBv2;
using Amazon.S3;
using Budget.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add AWS Lambda support
builder.Services.AddAWSLambdaHosting(LambdaEventSource.HttpApi);

// Configure Authentication
var cognitoConfig = builder.Configuration.GetSection("Cognito");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var region = cognitoConfig["Region"] ?? "eu-central-1";
        var userPoolId = cognitoConfig["UserPoolId"];

        options.Authority = $"https://cognito-idp.{region}.amazonaws.com/{userPoolId}";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            ValidateIssuer = true,
            ValidateAudience = false, // Cognito access tokens don't have aud claim
            ValidateLifetime = true,
        };
    });

builder.Services.AddAuthorization();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
                ?? ["http://localhost:5173"])
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Register AWS services
builder.Services.AddSingleton<IAmazonDynamoDB, AmazonDynamoDBClient>();
builder.Services.AddSingleton<IAmazonS3, AmazonS3Client>();

// Register application services
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IUserProfileService, UserProfileService>();

// Add controllers
builder.Services.AddControllers();

// Add health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Configure middleware pipeline
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapControllers();

app.Run();
