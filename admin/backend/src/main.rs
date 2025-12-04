use std::{env, net::SocketAddr};

use axum::{
    extract::{Path, State, Query},
    http::{HeaderValue, Method},
    routing::{delete, get, patch, post},
    Json, Router,
};
use bcrypt::{hash, verify, DEFAULT_COST};
use dotenvy::dotenv;
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool};
use tower_http::cors::{Any, CorsLayer};
use chrono::Utc;

#[derive(Clone)]
struct AppState {
    db: PgPool,
}

#[derive(Deserialize)]
struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Serialize)]
struct LoginResponse {
    success: bool,
}

#[derive(Serialize)]
struct ErrorResponse {
    message: String,
}

#[derive(Serialize)]
struct AdminUserSummary {
    id: String,
    email: String,
    #[serde(rename = "namaLengkap")]
    nama_lengkap: String,
    #[serde(rename = "createdAt")]
    created_at: String,
}

#[derive(Deserialize)]
struct UpdateUserRequest {
    email: Option<String>,
    #[serde(rename = "namaLengkap")]
    nama_lengkap: Option<String>,
}

#[derive(Serialize)]
struct AdminPostSummary {
    id: String,
    title: Option<String>,
    content: String,
    #[serde(rename = "authorEmail")]
    author_email: String,
    #[serde(rename = "createdAt")]
    created_at: String,
}

#[derive(Deserialize)]
struct UpdatePostRequest {
    title: Option<String>,
    content: Option<String>,
}

#[derive(Serialize)]
struct AdminMediaItem {
    id: String,
    kind: String,
    url: String,
    #[serde(rename = "postId")]
    post_id: String,
    #[serde(rename = "authorEmail")]
    author_email: String,
    #[serde(rename = "createdAt")]
    created_at: String,
    duration: Option<f64>,
}

#[derive(Serialize)]
struct AdminStorySummary {
    id: String,
    #[serde(rename = "mediaUrl")]
    media_url: String,
    #[serde(rename = "thumbnailUrl")]
    thumbnail_url: Option<String>,
    caption: Option<String>,
    #[serde(rename = "type")]
    story_type: String,
    #[serde(rename = "userEmail")]
    user_email: String,
    #[serde(rename = "createdAt")]
    created_at: String,
    #[serde(rename = "expiresAt")]
    expires_at: String,
}

#[derive(Deserialize)]
struct UpdateStoryRequest {
    caption: Option<String>,
}

#[derive(Serialize)]
struct AdminBlogPost {
    id: String,
    slug: String,
    title: String,
    excerpt: String,
    category: String,
    #[serde(rename = "readTimeMinutes")]
    read_time_minutes: i32,
    #[serde(rename = "publishedAt")]
    published_at: Option<String>,
    #[serde(rename = "authorName")]
    author_name: String,
    #[serde(rename = "authorRole")]
    author_role: String,
    tags: Vec<String>,
    status: String,
    body: Option<String>,
    #[serde(rename = "createdAt")]
    created_at: String,
    #[serde(rename = "updatedAt")]
    updated_at: String,
}

#[derive(Deserialize)]
struct BlogPostPayload {
    slug: String,
    title: String,
    excerpt: String,
    category: String,
    #[serde(rename = "readTimeMinutes")]
    read_time_minutes: i32,
    #[serde(rename = "publishedAt")]
    published_at: Option<String>,
    #[serde(rename = "authorName")]
    author_name: String,
    #[serde(rename = "authorRole")]
    author_role: String,
    tags: Vec<String>,
    status: String,
    body: Option<String>,
}

#[derive(Deserialize)]
struct SlugQuery {
    slug: String,
}

#[derive(Serialize)]
struct SlugCheckResponse {
    available: bool,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();

    let db_url = env::var("DATABASE_URL")
        .map_err(|_| "DATABASE_URL is not set; samakan dengan NestJS backend/Supabase")?;

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    // Jalankan migrasi & seeding selalu
    init_db(&pool).await?;
    seed_default_admin(&pool).await?;

    // Mode khusus: hanya migrasi lalu keluar (tanpa HTTP server)
    let migrate_only = env::var("ADMIN_MIGRATE_ONLY").unwrap_or_default();
    if migrate_only == "1" || migrate_only.eq_ignore_ascii_case("true") {
        println!("Admin DB migration & seeding selesai (ADMIN_MIGRATE_ONLY)");
        return Ok(());
    }

    let state = AppState { db: pool };

    // Konfigurasi CORS origin via ENV: ADMIN_CORS_ORIGIN
    // - Jika tidak di-set atau "*" -> allow any origin (hanya untuk dev)
    // - Jika di-set -> harus berupa origin tunggal, mis. "http://localhost:4200" atau URL Codespaces
    let cors_origin = env::var("ADMIN_CORS_ORIGIN").unwrap_or_else(|_| "*".to_string());

    let cors = if cors_origin == "*" {
        CorsLayer::new()
            .allow_origin(Any)
            .allow_methods([
                Method::GET,
                Method::POST,
                Method::PATCH,
                Method::DELETE,
                Method::OPTIONS,
            ])
            .allow_headers(Any)
    } else {
        let origin_header = HeaderValue::from_str(&cors_origin)
            .map_err(|_| "ADMIN_CORS_ORIGIN is not a valid origin URL")?;

        CorsLayer::new()
            .allow_origin(origin_header)
            .allow_methods([
                Method::GET,
                Method::POST,
                Method::PATCH,
                Method::DELETE,
                Method::OPTIONS,
            ])
            .allow_headers(Any)
    };

    let app = Router::new()
        .route("/admin/login", post(admin_login))
        .route("/admin/users", get(list_users))
        .route("/admin/users/:id", patch(update_user).delete(delete_user))
        .route("/admin/posts", get(list_posts))
        .route("/admin/posts/:id", patch(update_post).delete(delete_post))
        .route("/admin/media", get(list_media))
        .route("/admin/media/:kind/:id", delete(delete_media))
        .route("/admin/stories", get(list_stories))
        .route("/admin/stories/:id", patch(update_story).delete(delete_story))
        .route("/admin/blog", get(list_blog_posts).post(create_blog_post))
        .route("/admin/blog/:id", get(get_blog_post).put(update_blog_post))
        .route("/admin/blog/check-slug", get(check_blog_slug))
        .with_state(state)
        .layer(cors);

    let port: u16 = env::var("ADMIN_BACKEND_PORT")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(5000);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));

    println!("Admin backend listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn init_db(pool: &PgPool) -> Result<(), sqlx::Error> {
    // Tabel kredensial admin
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS admin_users (
            id UUID PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            is_superadmin BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}

async fn seed_default_admin(pool: &PgPool) -> Result<(), Box<dyn std::error::Error>> {
    let email = match env::var("ADMIN_DEFAULT_EMAIL") {
        Ok(v) if !v.is_empty() => v,
        _ => return Ok(()),
    };

    let password = match env::var("ADMIN_DEFAULT_PASSWORD") {
        Ok(v) if !v.is_empty() => v,
        _ => return Ok(()),
    };

    let password_hash = hash(password, DEFAULT_COST)?;
    let id = uuid::Uuid::new_v4();

    sqlx::query(
        r#"
        INSERT INTO admin_users (id, email, password_hash, is_superadmin)
        VALUES ($1, $2, $3, TRUE)
        ON CONFLICT (email) DO UPDATE
        SET password_hash = EXCLUDED.password_hash
        "#,
    )
    .bind(id)
    .bind(&email)
    .bind(&password_hash)
    .execute(pool)
    .await?;

    println!("Default admin user seeded: {}", email);

    Ok(())
}

async fn admin_login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, (axum::http::StatusCode, Json<ErrorResponse>)> {
    use axum::http::StatusCode;
    use sqlx::Row;

    let row = sqlx::query("SELECT password_hash FROM admin_users WHERE email = $1")
        .bind(&payload.email)
        .fetch_optional(&state.db)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    message: "Gagal memproses permintaan".to_string(),
                }),
            )
        })?;

    let Some(row) = row else {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                message: "Email atau kata sandi salah".to_string(),
            }),
        ));
    };

    let password_hash: String = row
        .try_get("password_hash")
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    message: "Data akun tidak valid".to_string(),
                }),
            )
        })?;

    let ok = verify(&payload.password, &password_hash).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                message: "Gagal memverifikasi kata sandi".to_string(),
            }),
        )
    })?;

    if !ok {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                message: "Email atau kata sandi salah".to_string(),
            }),
        ));
    }

    Ok(Json(LoginResponse { success: true }))
}

async fn list_users(
    State(state): State<AppState>,
) -> Result<Json<Vec<AdminUserSummary>>, (axum::http::StatusCode, Json<ErrorResponse>)> {
    use axum::http::StatusCode;
    use sqlx::Row;

    let rows = sqlx::query(
        r#"
        SELECT
          id,
          email,
          "namaLengkap" AS nama_lengkap,
          to_char("createdAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
        FROM "User"
        ORDER BY "createdAt" DESC
        LIMIT 100
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                message: "Gagal mengambil data pengguna".to_string(),
            }),
        )
    })?;

    let users = rows
        .into_iter()
        .map(|row| AdminUserSummary {
            id: row.try_get::<String, _>("id").unwrap_or_default(),
            email: row.try_get::<String, _>("email").unwrap_or_default(),
            nama_lengkap: row
                .try_get::<String, _>("nama_lengkap")
                .unwrap_or_else(|_| "".to_string()),
            created_at: row
                .try_get::<String, _>("created_at")
                .unwrap_or_else(|_| "".to_string()),
        })
        .collect();

    Ok(Json(users))
}

async fn list_posts(
    State(state): State<AppState>,
) -> Result<Json<Vec<AdminPostSummary>>, (axum::http::StatusCode, Json<ErrorResponse>)> {
    use axum::http::StatusCode;
    use sqlx::Row;

    let rows = sqlx::query(
        r#"
        SELECT
          p.id,
          p.title,
          p.content,
          u.email AS author_email,
          to_char(p."createdAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
        FROM "Post" p
        JOIN "User" u ON p."authorId" = u.id
        ORDER BY p."createdAt" DESC
        LIMIT 100
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                message: "Gagal mengambil data postingan".to_string(),
            }),
        )
    })?;

    let posts = rows
        .into_iter()
        .map(|row| AdminPostSummary {
            id: row.try_get::<String, _>("id").unwrap_or_default(),
            title: row.try_get::<Option<String>, _>("title").unwrap_or(None),
            content: row.try_get::<String, _>("content").unwrap_or_default(),
            author_email: row
                .try_get::<String, _>("author_email")
                .unwrap_or_else(|_| "".to_string()),
            created_at: row
                .try_get::<String, _>("created_at")
                .unwrap_or_else(|_| "".to_string()),
        })
        .collect();

    Ok(Json(posts))
}

async fn list_media(
    State(state): State<AppState>,
) -> Result<Json<Vec<AdminMediaItem>>, (axum::http::StatusCode, Json<ErrorResponse>)> {
    use axum::http::StatusCode;
    use sqlx::Row;

    let rows = sqlx::query(
        r#"
        SELECT * FROM (
          SELECT
            pi.id,
            'image' AS kind,
            pi.url,
            pi."postId" AS post_id,
            u.email AS author_email,
            to_char(p."createdAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
            NULL::double precision AS duration
          FROM "PostImage" pi
          JOIN "Post" p ON pi."postId" = p.id
          JOIN "User" u ON p."authorId" = u.id
          UNION ALL
          SELECT
            pv.id,
            'video' AS kind,
            pv.url,
            pv."postId" AS post_id,
            u.email AS author_email,
            to_char(p."createdAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
            pv.duration::double precision AS duration
          FROM "PostVideo" pv
          JOIN "Post" p ON pv."postId" = p.id
          JOIN "User" u ON p."authorId" = u.id
        ) m
        ORDER BY created_at DESC
        LIMIT 200
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                message: "Gagal mengambil data media".to_string(),
            }),
        )
    })?;

    let media = rows
        .into_iter()
        .map(|row| AdminMediaItem {
            id: row.try_get::<String, _>("id").unwrap_or_default(),
            kind: row.try_get::<String, _>("kind").unwrap_or_else(|_| "unknown".to_string()),
            url: row.try_get::<String, _>("url").unwrap_or_default(),
            post_id: row
                .try_get::<String, _>("post_id")
                .unwrap_or_else(|_| "".to_string()),
            author_email: row
                .try_get::<String, _>("author_email")
                .unwrap_or_else(|_| "".to_string()),
            created_at: row
                .try_get::<String, _>("created_at")
                .unwrap_or_else(|_| "".to_string()),
            duration: row.try_get::<Option<f64>, _>("duration").unwrap_or(None),
        })
        .collect();

    Ok(Json(media))
}

async fn list_stories(
    State(state): State<AppState>,
) -> Result<Json<Vec<AdminStorySummary>>, (axum::http::StatusCode, Json<ErrorResponse>)> {
    use axum::http::StatusCode;
    use sqlx::Row;

    let rows = sqlx::query(
        r#"
        SELECT
          s.id,
          s."mediaUrl" AS media_url,
          s."thumbnailUrl" AS thumbnail_url,
          s.caption,
          s.type::text AS story_type,
          u.email AS user_email,
          to_char(s."createdAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
          to_char(s."expiresAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS expires_at
        FROM "Story" s
        JOIN "User" u ON s."userId" = u.id
        ORDER BY s."createdAt" DESC
        LIMIT 200
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                message: "Gagal mengambil data story".to_string(),
            }),
        )
    })?;

    let stories = rows
        .into_iter()
        .map(|row| AdminStorySummary {
            id: row.try_get::<String, _>("id").unwrap_or_default(),
            media_url: row
                .try_get::<String, _>("media_url")
                .unwrap_or_else(|_| "".to_string()),
            thumbnail_url: row.try_get::<Option<String>, _>("thumbnail_url").unwrap_or(None),
            caption: row.try_get::<Option<String>, _>("caption").unwrap_or(None),
            story_type: row
                .try_get::<String, _>("story_type")
                .unwrap_or_else(|_| "".to_string()),
            user_email: row
                .try_get::<String, _>("user_email")
                .unwrap_or_else(|_| "".to_string()),
            created_at: row
                .try_get::<String, _>("created_at")
                .unwrap_or_else(|_| "".to_string()),
            expires_at: row
                .try_get::<String, _>("expires_at")
                .unwrap_or_else(|_| "".to_string()),
        })
        .collect();

    Ok(Json(stories))
}

async fn list_blog_posts(
    State(state): State<AppState>,
) -> Result<Json<Vec<AdminBlogPost>>, (axum::http::StatusCode, Json<ErrorResponse>)> {
    use axum::http::StatusCode;
    use sqlx::Row;

    let rows = sqlx::query(
        r#"
        SELECT
          "id",
          "slug",
          "title",
          "excerpt",
          "category"::text AS category,
          "readTimeMinutes" AS read_time_minutes,
          to_char("publishedAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS published_at,
          "authorName" AS author_name,
          "authorRole" AS author_role,
          tags,
          "status"::text AS status,
          body,
          to_char("createdAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
          to_char("updatedAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at
        FROM "BlogPost"
        ORDER BY "publishedAt" DESC NULLS LAST, "createdAt" DESC
        LIMIT 200
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        eprintln!("list_blog_posts error: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                message: "Gagal mengambil data blog post".to_string(),
            }),
        )
    })?;

    let posts = rows
        .into_iter()
        .map(|row| AdminBlogPost {
            id: row.try_get::<String, _>("id").unwrap_or_default(),
            slug: row.try_get::<String, _>("slug").unwrap_or_default(),
            title: row
                .try_get::<String, _>("title")
                .unwrap_or_else(|_| "".to_string()),
            excerpt: row
                .try_get::<String, _>("excerpt")
                .unwrap_or_else(|_| "".to_string()),
            category: row
                .try_get::<String, _>("category")
                .unwrap_or_else(|_| "".to_string()),
            read_time_minutes: row
                .try_get::<i32, _>("read_time_minutes")
                .unwrap_or(0),
            published_at: row
                .try_get::<Option<String>, _>("published_at")
                .unwrap_or(None),
            author_name: row
                .try_get::<String, _>("author_name")
                .unwrap_or_else(|_| "".to_string()),
            author_role: row
                .try_get::<String, _>("author_role")
                .unwrap_or_else(|_| "".to_string()),
            tags: row
                .try_get::<Vec<String>, _>("tags")
                .unwrap_or_else(|_| Vec::new()),
            status: row
                .try_get::<String, _>("status")
                .unwrap_or_else(|_| "".to_string()),
            body: row.try_get::<Option<String>, _>("body").unwrap_or(None),
            created_at: row
                .try_get::<String, _>("created_at")
                .unwrap_or_else(|_| "".to_string()),
            updated_at: row
                .try_get::<String, _>("updated_at")
                .unwrap_or_else(|_| "".to_string()),
        })
        .collect();

    Ok(Json(posts))
}

async fn update_user(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateUserRequest>,
) -> Result<Json<LoginResponse>, (axum::http::StatusCode, Json<ErrorResponse>)> {
    use axum::http::StatusCode;

    if payload.email.is_none() && payload.nama_lengkap.is_none() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                message: "Tidak ada data yang diubah".to_string(),
            }),
        ));
    }

    let mut set_clauses = Vec::new();
    let mut bind_values: Vec<String> = Vec::new();

    if let Some(email) = payload.email {
        set_clauses.push("email = $".to_string() + &(set_clauses.len() + 1).to_string());
        bind_values.push(email);
    }

    if let Some(nama) = payload.nama_lengkap {
        set_clauses.push("\"namaLengkap\" = $".to_string() + &(set_clauses.len() + 1).to_string());
        bind_values.push(nama);
    }

    let query = format!(
        "UPDATE \"User\" SET {} WHERE id = ${}",
        set_clauses.join(", "),
        bind_values.len() + 1
    );

    let mut q = sqlx::query(&query);
    for value in &bind_values {
        q = q.bind(value);
    }
    q = q.bind(&id);

    let result = q.execute(&state.db).await.map_err(|e| {
        eprintln!("update_user error for id {}: {}", id, e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                message: "Gagal memperbarui pengguna".to_string(),
            }),
        )
    })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                message: "Pengguna tidak ditemukan".to_string(),
            }),
        ));
    }

    Ok(Json(LoginResponse { success: true }))
}

async fn get_blog_post(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<AdminBlogPost>, (axum::http::StatusCode, Json<ErrorResponse>)> {
    use axum::http::StatusCode;
    use sqlx::Row;

    let row = sqlx::query(
        r#"
        SELECT
          "id",
          "slug",
          "title",
          "excerpt",
          "category"::text AS category,
          "readTimeMinutes" AS read_time_minutes,
          to_char("publishedAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS published_at,
          "authorName" AS author_name,
          "authorRole" AS author_role,
          tags,
          "status"::text AS status,
          body,
          to_char("createdAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
          to_char("updatedAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at
        FROM "BlogPost"
        WHERE "id" = $1
        "#,
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        eprintln!("get_blog_post error for id {}: {}", id, e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                message: "Gagal mengambil blog post".to_string(),
            }),
        )
    })?;

    let Some(row) = row else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                message: "Blog post tidak ditemukan".to_string(),
            }),
        ));
    };

    let post = AdminBlogPost {
        id: row.try_get::<String, _>("id").unwrap_or_default(),
        slug: row.try_get::<String, _>("slug").unwrap_or_default(),
        title: row
            .try_get::<String, _>("title")
            .unwrap_or_else(|_| "".to_string()),
        excerpt: row
            .try_get::<String, _>("excerpt")
            .unwrap_or_else(|_| "".to_string()),
        category: row
            .try_get::<String, _>("category")
            .unwrap_or_else(|_| "".to_string()),
        read_time_minutes: row
            .try_get::<i32, _>("read_time_minutes")
            .unwrap_or(0),
        published_at: row
            .try_get::<Option<String>, _>("published_at")
            .unwrap_or(None),
        author_name: row
            .try_get::<String, _>("author_name")
            .unwrap_or_else(|_| "".to_string()),
        author_role: row
            .try_get::<String, _>("author_role")
            .unwrap_or_else(|_| "".to_string()),
        tags: row
            .try_get::<Vec<String>, _>("tags")
            .unwrap_or_else(|_| Vec::new()),
        status: row
            .try_get::<String, _>("status")
            .unwrap_or_else(|_| "".to_string()),
        body: row.try_get::<Option<String>, _>("body").unwrap_or(None),
        created_at: row
            .try_get::<String, _>("created_at")
            .unwrap_or_else(|_| "".to_string()),
        updated_at: row
            .try_get::<String, _>("updated_at")
            .unwrap_or_else(|_| "".to_string()),
    };

    Ok(Json(post))
}

async fn delete_user(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<LoginResponse>, (axum::http::StatusCode, Json<ErrorResponse>)> {
    use axum::http::StatusCode;

    let result = sqlx::query(r#"DELETE FROM "User" WHERE id = $1"#)
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            eprintln!("delete_user error for id {}: {}", id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    message: "Gagal menghapus pengguna".to_string(),
                }),
            )
        })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                message: "Pengguna tidak ditemukan".to_string(),
            }),
        ));
    }

    Ok(Json(LoginResponse { success: true }))
}

async fn update_post(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<UpdatePostRequest>,
) -> Result<Json<LoginResponse>, (axum::http::StatusCode, Json<ErrorResponse>)> {
    use axum::http::StatusCode;

    if payload.title.is_none() && payload.content.is_none() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                message: "Tidak ada data yang diubah".to_string(),
            }),
        ));
    }

    let mut set_clauses = Vec::new();
    let mut bind_values: Vec<String> = Vec::new();

    if let Some(title) = payload.title {
        set_clauses.push("title = $".to_string() + &(set_clauses.len() + 1).to_string());
        bind_values.push(title);
    }

    if let Some(content) = payload.content {
        set_clauses.push("content = $".to_string() + &(set_clauses.len() + 1).to_string());
        bind_values.push(content);
    }

    let query = format!(
        "UPDATE \"Post\" SET {} WHERE id = ${}",
        set_clauses.join(", "),
        bind_values.len() + 1
    );

    let mut q = sqlx::query(&query);
    for value in &bind_values {
        q = q.bind(value);
    }
    q = q.bind(&id);

    let result = q.execute(&state.db).await.map_err(|e| {
        eprintln!("update_post error for id {}: {}", id, e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                message: "Gagal memperbarui postingan".to_string(),
            }),
        )
    })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                message: "Postingan tidak ditemukan".to_string(),
            }),
        ));
    }

    Ok(Json(LoginResponse { success: true }))
}

async fn create_blog_post(
    State(state): State<AppState>,
    Json(payload): Json<BlogPostPayload>,
) -> Result<Json<AdminBlogPost>, (axum::http::StatusCode, Json<ErrorResponse>)> {
    use axum::http::StatusCode;
    use sqlx::Row;

    if payload.read_time_minutes <= 0 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                message: "readTimeMinutes harus lebih besar dari 0".to_string(),
            }),
        ));
    }

    if !matches!(
        payload.category.as_str(),
        "ProductAndVision" | "Engineering" | "Design" | "Culture"
    ) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                message: "Kategori blog tidak valid".to_string(),
            }),
        ));
    }

    if !matches!(
        payload.status.as_str(),
        "DRAFT" | "SCHEDULED" | "PUBLISHED"
    ) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                message: "Status blog tidak valid".to_string(),
            }),
        ));
    }

    let BlogPostPayload {
        slug,
        title,
        excerpt,
        category,
        read_time_minutes,
        published_at,
        author_name,
        author_role,
        tags,
        status,
        body,
    } = payload;

    let id = uuid::Uuid::new_v4().to_string();

    let mut clean_tags: Vec<String> = tags
        .into_iter()
        .map(|t| t.trim().to_string())
        .filter(|t| !t.is_empty())
        .collect();

    clean_tags.sort();
    clean_tags.dedup();

    let mut normalized_published_at = published_at
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string());

    match status.as_str() {
        "DRAFT" => {}
        "SCHEDULED" => {
            if normalized_published_at.is_none() {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(ErrorResponse {
                        message: "publishedAt wajib diisi untuk status SCHEDULED".to_string(),
                    }),
                ));
            }
        }
        "PUBLISHED" => {
            if normalized_published_at.is_none() {
                normalized_published_at = Some(Utc::now().to_rfc3339());
            }
        }
        _ => {}
    }

    let row = sqlx::query(
        r#"
        INSERT INTO "BlogPost" (
          "id",
          "slug",
          "title",
          "excerpt",
          "category",
          "readTimeMinutes",
          "publishedAt",
          "authorName",
          "authorRole",
          tags,
          "status",
          body,
          "updatedAt"
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5::"BlogPostCategory",
          $6,
          $7::TIMESTAMP(3),
          $8,
          $9,
          $10,
          $11::"BlogPostStatus",
          $12,
          NOW()
        )
        RETURNING
          "id",
          "slug",
          "title",
          "excerpt",
          "category"::text AS category,
          "readTimeMinutes" AS read_time_minutes,
          to_char("publishedAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS published_at,
          "authorName" AS author_name,
          "authorRole" AS author_role,
          tags,
          "status"::text AS status,
          body,
          to_char("createdAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
          to_char("updatedAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at
        "#,
    )
    .bind(&id)
    .bind(&slug)
    .bind(&title)
    .bind(&excerpt)
    .bind(&category)
    .bind(read_time_minutes)
    .bind(&normalized_published_at)
    .bind(&author_name)
    .bind(&author_role)
    .bind(&clean_tags)
    .bind(&status)
    .bind(&body)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        eprintln!("create_blog_post error for slug {}: {}", slug, e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                message: format!("Gagal membuat blog post: {}", e),
            }),
        )
    })?;

    let post = AdminBlogPost {
        id: row.try_get::<String, _>("id").unwrap_or_default(),
        slug: row.try_get::<String, _>("slug").unwrap_or_default(),
        title: row
            .try_get::<String, _>("title")
            .unwrap_or_else(|_| "".to_string()),
        excerpt: row
            .try_get::<String, _>("excerpt")
            .unwrap_or_else(|_| "".to_string()),
        category: row
            .try_get::<String, _>("category")
            .unwrap_or_else(|_| "".to_string()),
        read_time_minutes: row
            .try_get::<i32, _>("read_time_minutes")
            .unwrap_or(0),
        published_at: row
            .try_get::<Option<String>, _>("published_at")
            .unwrap_or(None),
        author_name: row
            .try_get::<String, _>("author_name")
            .unwrap_or_else(|_| "".to_string()),
        author_role: row
            .try_get::<String, _>("author_role")
            .unwrap_or_else(|_| "".to_string()),
        tags: row
            .try_get::<Vec<String>, _>("tags")
            .unwrap_or_else(|_| Vec::new()),
        status: row
            .try_get::<String, _>("status")
            .unwrap_or_else(|_| "".to_string()),
        body: row.try_get::<Option<String>, _>("body").unwrap_or(None),
        created_at: row
            .try_get::<String, _>("created_at")
            .unwrap_or_else(|_| "".to_string()),
        updated_at: row
            .try_get::<String, _>("updated_at")
            .unwrap_or_else(|_| "".to_string()),
    };

    Ok(Json(post))
}

async fn delete_post(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<LoginResponse>, (axum::http::StatusCode, Json<ErrorResponse>)> {
    use axum::http::StatusCode;

    let result = sqlx::query(r#"DELETE FROM "Post" WHERE id = $1"#)
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            eprintln!("delete_post error for id {}: {}", id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    message: "Gagal menghapus postingan".to_string(),
                }),
            )
        })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                message: "Postingan tidak ditemukan".to_string(),
            }),
        ));
    }

    Ok(Json(LoginResponse { success: true }))
}

async fn delete_media(
    State(state): State<AppState>,
    Path((kind, id)): Path<(String, String)>,
) -> Result<Json<LoginResponse>, (axum::http::StatusCode, Json<ErrorResponse>)> {
    use axum::http::StatusCode;

    let table = match kind.as_str() {
        "image" => "PostImage",
        "video" => "PostVideo",
        _ => {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    message: "Tipe media tidak dikenal".to_string(),
                }),
            ))
        }
    };

    let query = format!("DELETE FROM \"{}\" WHERE id = $1", table);

    let result = sqlx::query(&query)
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            eprintln!("delete_media error for kind {} id {}: {}", kind, id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    message: "Gagal menghapus media".to_string(),
                }),
            )
        })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                message: "Media tidak ditemukan".to_string(),
            }),
        ));
    }

    Ok(Json(LoginResponse { success: true }))
}

async fn update_blog_post(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<BlogPostPayload>,
) -> Result<Json<AdminBlogPost>, (axum::http::StatusCode, Json<ErrorResponse>)> {
    use axum::http::StatusCode;
    use sqlx::Row;

    if payload.read_time_minutes <= 0 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                message: "readTimeMinutes harus lebih besar dari 0".to_string(),
            }),
        ));
    }

    if !matches!(
        payload.category.as_str(),
        "ProductAndVision" | "Engineering" | "Design" | "Culture"
    ) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                message: "Kategori blog tidak valid".to_string(),
            }),
        ));
    }

    if !matches!(
        payload.status.as_str(),
        "DRAFT" | "SCHEDULED" | "PUBLISHED"
    ) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                message: "Status blog tidak valid".to_string(),
            }),
        ));
    }

    let BlogPostPayload {
        slug,
        title,
        excerpt,
        category,
        read_time_minutes,
        published_at,
        author_name,
        author_role,
        tags,
        status,
        body,
    } = payload;

    let mut clean_tags: Vec<String> = tags
        .into_iter()
        .map(|t| t.trim().to_string())
        .filter(|t| !t.is_empty())
        .collect();

    clean_tags.sort();
    clean_tags.dedup();

    let mut normalized_published_at = published_at
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string());

    match status.as_str() {
        "DRAFT" => {}
        "SCHEDULED" => {
            if normalized_published_at.is_none() {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(ErrorResponse {
                        message: "publishedAt wajib diisi untuk status SCHEDULED".to_string(),
                    }),
                ));
            }
        }
        "PUBLISHED" => {
            if normalized_published_at.is_none() {
                normalized_published_at = Some(Utc::now().to_rfc3339());
            }
        }
        _ => {}
    }

    let row = sqlx::query(
        r#"
        UPDATE "BlogPost" SET
          "slug" = $1,
          "title" = $2,
          "excerpt" = $3,
          "category" = $4::"BlogPostCategory",
          "readTimeMinutes" = $5,
          "publishedAt" = $6::TIMESTAMP(3),
          "authorName" = $7,
          "authorRole" = $8,
          tags = $9,
          "status" = $10::"BlogPostStatus",
          body = $11
        WHERE "id" = $12
        RETURNING
          "id",
          "slug",
          "title",
          "excerpt",
          "category"::text AS category,
          "readTimeMinutes" AS read_time_minutes,
          to_char("publishedAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS published_at,
          "authorName" AS author_name,
          "authorRole" AS author_role,
          tags,
          "status"::text AS status,
          body,
          to_char("createdAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
          to_char("updatedAt", 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at
        "#,
    )
    .bind(&slug)
    .bind(&title)
    .bind(&excerpt)
    .bind(&category)
    .bind(read_time_minutes)
    .bind(&normalized_published_at)
    .bind(&author_name)
    .bind(&author_role)
    .bind(&clean_tags)
    .bind(&status)
    .bind(&body)
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        eprintln!("update_blog_post error for id {}: {}", id, e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                message: "Gagal memperbarui blog post".to_string(),
            }),
        )
    })?;

    let Some(row) = row else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                message: "Blog post tidak ditemukan".to_string(),
            }),
        ));
    };

    let post = AdminBlogPost {
        id: row.try_get::<String, _>("id").unwrap_or_default(),
        slug: row.try_get::<String, _>("slug").unwrap_or_default(),
        title: row
            .try_get::<String, _>("title")
            .unwrap_or_else(|_| "".to_string()),
        excerpt: row
            .try_get::<String, _>("excerpt")
            .unwrap_or_else(|_| "".to_string()),
        category: row
            .try_get::<String, _>("category")
            .unwrap_or_else(|_| "".to_string()),
        read_time_minutes: row
            .try_get::<i32, _>("read_time_minutes")
            .unwrap_or(0),
        published_at: row
            .try_get::<Option<String>, _>("published_at")
            .unwrap_or(None),
        author_name: row
            .try_get::<String, _>("author_name")
            .unwrap_or_else(|_| "".to_string()),
        author_role: row
            .try_get::<String, _>("author_role")
            .unwrap_or_else(|_| "".to_string()),
        tags: row
            .try_get::<Vec<String>, _>("tags")
            .unwrap_or_else(|_| Vec::new()),
        status: row
            .try_get::<String, _>("status")
            .unwrap_or_else(|_| "".to_string()),
        body: row.try_get::<Option<String>, _>("body").unwrap_or(None),
        created_at: row
            .try_get::<String, _>("created_at")
            .unwrap_or_else(|_| "".to_string()),
        updated_at: row
            .try_get::<String, _>("updated_at")
            .unwrap_or_else(|_| "".to_string()),
    };

    Ok(Json(post))
}

async fn update_story(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateStoryRequest>,
) -> Result<Json<LoginResponse>, (axum::http::StatusCode, Json<ErrorResponse>)> {
    use axum::http::StatusCode;

    if payload.caption.is_none() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                message: "Tidak ada data yang diubah".to_string(),
            }),
        ));
    }

    let caption = payload.caption.unwrap_or_default();

    let result = sqlx::query(r#"UPDATE "Story" SET caption = $1 WHERE id = $2"#)
        .bind(&caption)
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            eprintln!("update_story error for id {}: {}", id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    message: "Gagal memperbarui story".to_string(),
                }),
            )
        })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                message: "Story tidak ditemukan".to_string(),
            }),
        ));
    }

    Ok(Json(LoginResponse { success: true }))
}

async fn delete_story(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<LoginResponse>, (axum::http::StatusCode, Json<ErrorResponse>)> {
    use axum::http::StatusCode;

    let result = sqlx::query(r#"DELETE FROM "Story" WHERE id = $1"#)
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            eprintln!("delete_story error for id {}: {}", id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    message: "Gagal menghapus story".to_string(),
                }),
            )
        })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                message: "Story tidak ditemukan".to_string(),
            }),
        ));
    }

    Ok(Json(LoginResponse { success: true }))
}

async fn check_blog_slug(
    State(state): State<AppState>,
    Query(query): Query<SlugQuery>,
) -> Result<Json<SlugCheckResponse>, (axum::http::StatusCode, Json<ErrorResponse>)> {
    use axum::http::StatusCode;

    if query.slug.trim().is_empty() {
        return Ok(Json(SlugCheckResponse { available: false }));
    }

    let row = sqlx::query(r#"SELECT 1 AS exists FROM "BlogPost" WHERE "slug" = $1 LIMIT 1"#)
        .bind(&query.slug)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            eprintln!("check_blog_slug error for slug {}: {}", query.slug, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    message: "Gagal memeriksa slug".to_string(),
                }),
            )
        })?;

    Ok(Json(SlugCheckResponse {
        available: row.is_none(),
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::extract::State;
    use sqlx::postgres::PgPoolOptions;

    #[tokio::test]
    async fn create_blog_post_allows_null_published_at() {
        dotenv().ok();

        let db_url = std::env::var("DATABASE_URL")
            .expect("DATABASE_URL must be set for tests");

        let pool = PgPoolOptions::new()
            .max_connections(1)
            .connect(&db_url)
            .await
            .expect("failed to connect to database");

        let state = AppState { db: pool };

        let payload = BlogPostPayload {
            slug: format!("test-slug-{}", uuid::Uuid::new_v4()),
            title: "Test Post".to_string(),
            excerpt: "Excerpt".to_string(),
            category: "ProductAndVision".to_string(),
            read_time_minutes: 5,
            published_at: None,
            author_name: "Author".to_string(),
            author_role: "Role".to_string(),
            tags: vec!["test".to_string()],
            status: "DRAFT".to_string(),
            body: Some("Body".to_string()),
        };

        let result = create_blog_post(State(state), axum::Json(payload)).await;
        assert!(result.is_ok(), "create_blog_post should succeed for minimal valid payload");
    }
}
