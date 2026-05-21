using API_VanHungThinh.Models;
using API_VanHungThinh.Services;
using API_VanHungThinh.Services.Interface;
using API_VanHungThinh.Hubs;
using API_VanHungThinh.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using MongoDB.Driver.GridFS;
using System.Text;
using DotNetEnv;
using AspNetCoreRateLimit;
using Microsoft.OpenApi.Models;
using System.Linq;
using Serilog;

namespace API_VanHungThinh
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // ✅ Configure Serilog
            Log.Logger = new LoggerConfiguration()
                .ReadFrom.Configuration(builder.Configuration)
                .Enrich.FromLogContext()
                .WriteTo.Console()
                .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day)
                .CreateLogger();

            builder.Host.UseSerilog();

            // ✅ Load biến môi trường (nếu có .env file)
            DotNetEnv.Env.Load();

            // ✅ Load cấu hình từ appsettings và env
            builder.Configuration
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddEnvironmentVariables();

            // ✅ Đọc JWT key từ cấu hình (env hoặc appsettings)
            var key = builder.Configuration["Jwt:Key"] ?? Environment.GetEnvironmentVariable("JWT_KEY");
            if (string.IsNullOrEmpty(key))
            {
                throw new Exception("JWT Key is missing from configuration or environment variable 'JWT_KEY'.");
            }

            // ✅ Cấu hình MongoDbSettings từ appsettings
            builder.Services.Configure<MongoDbSettings>(
                builder.Configuration.GetSection("MongoDbSettings"));

            // ✅ Đăng ký MongoClient
            builder.Services.AddSingleton<IMongoClient>(serviceProvider =>
            {
                var settings = serviceProvider.GetRequiredService<IOptions<MongoDbSettings>>().Value;
                return new MongoClient(settings.ConnectionString);
            });

            // ✅ Đăng ký MongoDatabase để khai báo service cho các collection và service cần truy cập database
            builder.Services.AddScoped(serviceProvider =>
            {
                var settings = serviceProvider.GetRequiredService<IOptions<MongoDbSettings>>().Value;
                var client = serviceProvider.GetRequiredService<IMongoClient>();
                return client.GetDatabase(settings.DatabaseName);
            });

            // ✅ Đăng ký GridFSBucket
            builder.Services.AddScoped<GridFSBucket>(serviceProvider =>
            {
                var database = serviceProvider.GetRequiredService<IMongoDatabase>();
                return new GridFSBucket(database);
            });

            // ✅ Đăng ký các service trong dự án
            builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddScoped<IRefreshTokenService, RefreshTokenService>();
            builder.Services.AddScoped<IDepartmentService, DepartmentService>();
            builder.Services.AddSingleton<IUserLogService, UserLogService>();
            builder.Services.AddScoped<ITaskService, TaskService>();
            builder.Services.AddScoped<ICustomerService, CustomerService>();
            builder.Services.AddScoped<IProductService, ProductService>();
            builder.Services.AddScoped<IBillService, BillService>();
            builder.Services.AddScoped<IStatusBillHistoryService, StatusBillHistoryService>();
            builder.Services.AddScoped<IBillItemService, BillItemService>();
            builder.Services.AddScoped<IMergedBillService, MergedBillService>();
            builder.Services.AddScoped<IBlogService, BlogService>();
            builder.Services.AddScoped<IDeliveryService, DeliveryService>();
            builder.Services.AddScoped<IProductPriceByCustomerTypeService, ProductPriceByCustomerTypeService>();
            builder.Services.AddScoped<IReportingService, ReportingService>();
            builder.Services.AddHttpClient();
            builder.Services.AddScoped<IAIChatService, AIChatService>();
            // Permission and Settings services (simple role->features mapping and project settings)
            builder.Services.AddScoped<IPermissionService, PermissionService>();
            builder.Services.AddScoped<ISettingsService, SettingsService>();

            // ✅ Redis Distributed Caching
            builder.Services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
                options.InstanceName = "VanHungThinh_";
            });

            // ✅ Rate Limiting
            builder.Services.AddMemoryCache();
            builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
            builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
            builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
            builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
            builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();

            // ✅ SMTP settings
            builder.Services.Configure<SmtpSettings>(options =>
            {
                builder.Configuration.GetSection("SmtpSettings").Bind(options);

                // Ghi đè mật khẩu nếu có trong biến môi trường
                var envPassword = builder.Configuration["SMTP__Password"];
                if (!string.IsNullOrEmpty(envPassword))
                {
                    options.Password = envPassword;
                }
            });

            builder.Services.AddScoped<EmailService>();

            // ✅ CORS: read allowed origins from environment/config so we don't hardcode for prod
            var allowedOrigins = builder.Configuration["ALLOWED_ORIGINS"] ?? string.Empty;
            var origins = allowedOrigins
                .Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(o => o.Trim())
                .Where(o => !string.IsNullOrEmpty(o))
                .ToArray();

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontendOrigin", policy =>
                {
                    if (origins.Length > 0)
                    {
                        policy.WithOrigins(origins)
                              .AllowAnyHeader()
                              .AllowAnyMethod()
                              .AllowCredentials();
                    }
                    else if (builder.Environment.IsDevelopment())
                    {
                        // fallback for local development if ALLOWED_ORIGINS not set
                        policy.WithOrigins("http://localhost:3000", "http://localhost:8080")
                              .AllowAnyHeader()
                              .AllowAnyMethod()
                              .AllowCredentials();
                    }
                    else
                    {
                        // production-safe default: allow no cross-origin credentialed requests
                        policy.AllowAnyHeader()
                              .AllowAnyMethod();
                    }
                });
            });

            // ✅ JWT Authentication
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = builder.Configuration["Jwt:Issuer"],
                        ValidAudience = builder.Configuration["Jwt:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key))
                    };

                    // ✅ Support SignalR token from query string
                    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var accessToken = context.Request.Query["access_token"];
                            var path = context.HttpContext.Request.Path;
                            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                            {
                                context.Token = accessToken;
                            }
                            return System.Threading.Tasks.Task.CompletedTask;
                        }
                    };
                });

            builder.Services.AddAuthorization();

            // ✅ Swagger
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(options =>
            {
                // Add JWT bearer definition so Swagger UI shows "Authorize" button
                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "Enter 'Bearer' [space] and then your valid token. Example: 'Bearer eyJhbGci...'"
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        new string[] { }
                    }
                });
            });

            // ✅ Thêm Controller
            builder.Services.AddControllers();

            // ✅ SignalR for real-time notifications
            builder.Services.AddSignalR();
            builder.Services.AddScoped<INotificationService, NotificationService>();

            var app = builder.Build();

            // Run DB initializer (safe: catches errors and won't stop app)


            // ✅ Swagger only in dev/prod
            if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            // ✅ HTTPS (chỉ bật ngoài production)
            if (app.Environment.IsProduction())
            {
                app.UseHttpsRedirection();
            }

            // ✅ Middlewares
            app.UseCors("AllowFrontendOrigin");
            app.UseMiddleware<GlobalExceptionMiddleware>();
            app.UseIpRateLimiting();
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            // ✅ SignalR Hub endpoint
            app.MapHub<NotificationHub>("/hubs/notification");

            app.Run();
        }
    }
}


