import { Component, signal } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  isSubmitting = signal(false);
  serverError = signal<string | null>(null);
  isAuthenticated = signal(false);
  showSplash = signal(false);
  successMessage = signal<string | null>(null);
  adminEmail = signal<string | null>(null);
  activeSection = signal<'dashboard' | 'users' | 'posts' | 'media' | 'blog'>('dashboard');
  users = signal<AdminUser[] | null>(null);
  isLoadingUsers = signal(false);
  usersError = signal<string | null>(null);
  editingUserId = signal<string | null>(null);
  editNamaLengkap = signal<string>('');
  editEmail = signal<string>('');
  isSavingUser = signal(false);
  deletingUserId = signal<string | null>(null);

  posts = signal<AdminPost[] | null>(null);
  isLoadingPosts = signal(false);
  postsError = signal<string | null>(null);
  editingPostId = signal<string | null>(null);
  editPostTitle = signal<string>('');
  editPostContent = signal<string>('');
  isSavingPost = signal(false);
  deletingPostId = signal<string | null>(null);

  media = signal<AdminMediaItem[] | null>(null);
  isLoadingMedia = signal(false);
  mediaError = signal<string | null>(null);
  deletingMediaId = signal<string | null>(null);

  stories = signal<AdminStory[] | null>(null);
  isLoadingStories = signal(false);
  storiesError = signal<string | null>(null);
  editingStoryId = signal<string | null>(null);
  editStoryCaption = signal<string>('');
  isSavingStory = signal(false);
  deletingStoryId = signal<string | null>(null);

  blogPosts = signal<AdminBlogPost[] | null>(null);
  isLoadingBlog = signal(false);
  blogError = signal<string | null>(null);
  editingBlogId = signal<string | null>(null);
  isSavingBlog = signal(false);
  isCheckingSlug = signal(false);
  slugAvailable = signal<boolean | null>(null);

  blogTitle = signal<string>('');
  blogSlug = signal<string>('');
  blogExcerpt = signal<string>('');
  blogCategory = signal<'ProductAndVision' | 'Engineering' | 'Design' | 'Culture'>(
    'ProductAndVision',
  );
  blogReadTimeMinutes = signal<number>(5);
  blogPublishedAt = signal<string | null>(null);
  blogAuthorName = signal<string>('');
  blogAuthorRole = signal<string>('');
  blogTagsInput = signal<string>('');
  blogStatus = signal<'DRAFT' | 'SCHEDULED' | 'PUBLISHED'>('DRAFT');
  blogBody = signal<string>('');

  private readonly apiBase = environment.adminApiBaseUrl;

  constructor(private http: HttpClient) {}

  setActiveSection(section: 'dashboard' | 'users' | 'posts' | 'media' | 'blog'): void {
    this.activeSection.set(section);
    if (section === 'users') {
      this.loadUsers();
    } else if (section === 'posts') {
      this.loadPosts();
    } else if (section === 'media') {
      this.loadMedia();
      this.loadStories();
    } else if (section === 'blog') {
      this.loadBlogPosts();
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.serverError.set(null);
    this.successMessage.set(null);
    this.isSubmitting.set(true);

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = (formData.get('email') ?? '').toString();
    const password = (formData.get('password') ?? '').toString();

    this.http
      .post<{ success: boolean }>(`${this.apiBase}/admin/login`, { email, password })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.adminEmail.set(email);
            this.successMessage.set('Login berhasil. Mengarahkan ke dashboard admin...');
            this.showSplash.set(true);
            setTimeout(() => {
              this.showSplash.set(false);
              this.isAuthenticated.set(true);
              this.successMessage.set(null);
              // Default ke dashboard, data user bisa di-load saat menu dibuka
              this.activeSection.set('dashboard');
            }, 1000);
          } else {
            this.serverError.set('Email atau kata sandi salah');
          }

          // Apa pun hasilnya, hentikan state "memeriksa"
          this.isSubmitting.set(false);
        },
        error: (err) => {
          const msg =
            (err?.error && (err.error.message as string)) || 'Email atau kata sandi salah';
          this.serverError.set(msg);
          this.isSubmitting.set(false);
        },
      });
  }

  onLogout(): void {
    this.isAuthenticated.set(false);
    this.showSplash.set(false);
    this.isSubmitting.set(false);
    this.serverError.set(null);
    this.successMessage.set(null);
    // Biarkan adminEmail bertahan agar email tetap terlihat di form, atau reset jika ingin benar-benar bersih.
  }

  startEditUser(user: AdminUser): void {
    this.editingUserId.set(user.id);
    this.editNamaLengkap.set(user.namaLengkap || '');
    this.editEmail.set(user.email);
    this.usersError.set(null);
  }

  cancelEditUser(): void {
    this.editingUserId.set(null);
    this.isSavingUser.set(false);
  }

  saveUserEdit(): void {
    const id = this.editingUserId();
    if (!id) return;

    this.isSavingUser.set(true);
    this.usersError.set(null);

    const body: Partial<AdminUser> = {
      email: this.editEmail().trim(),
      namaLengkap: this.editNamaLengkap().trim(),
    };

    this.http
      .patch<{ success: boolean }>(`${this.apiBase}/admin/users/${id}`, body)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.editingUserId.set(null);
            this.isSavingUser.set(false);
            this.loadUsers(true);
          } else {
            this.usersError.set('Gagal menyimpan perubahan pengguna');
            this.isSavingUser.set(false);
          }
        },
        error: () => {
          this.usersError.set('Gagal menyimpan perubahan pengguna');
          this.isSavingUser.set(false);
        },
      });
  }

  deleteUser(user: AdminUser): void {
    if (!confirm(`Hapus pengguna ${user.email}?`)) {
      return;
    }

    this.deletingUserId.set(user.id);
    this.usersError.set(null);

    this.http
      .delete<{ success: boolean }>(`${this.apiBase}/admin/users/${user.id}`)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.deletingUserId.set(null);
            this.loadUsers(true);
          } else {
            this.usersError.set('Gagal menghapus pengguna');
            this.deletingUserId.set(null);
          }
        },
        error: () => {
          this.usersError.set('Gagal menghapus pengguna');
          this.deletingUserId.set(null);
        },
      });
  }

  private loadUsers(force = false): void {
    // Hindari reload kalau sudah ada data dan tidak ada error, kecuali dipaksa
    if (!force && this.users() && !this.usersError()) {
      return;
    }

    this.isLoadingUsers.set(true);
    this.usersError.set(null);

    this.http
      .get<AdminUser[]>(`${this.apiBase}/admin/users`)
      .subscribe({
        next: (data) => {
          this.users.set(data);
          this.isLoadingUsers.set(false);
        },
        error: () => {
          this.usersError.set('Gagal memuat data pengguna');
          this.isLoadingUsers.set(false);
        },
      });
  }

  startEditPost(post: AdminPost): void {
    this.editingPostId.set(post.id);
    this.editPostTitle.set(post.title ?? '');
    this.editPostContent.set(post.content);
    this.postsError.set(null);
  }

  cancelEditPost(): void {
    this.editingPostId.set(null);
    this.isSavingPost.set(false);
  }

  savePostEdit(): void {
    const id = this.editingPostId();
    if (!id) return;

    this.isSavingPost.set(true);
    this.postsError.set(null);

    const body: Partial<AdminPost> = {
      title: this.editPostTitle().trim() || null,
      content: this.editPostContent().trim(),
    };

    this.http
      .patch<{ success: boolean }>(`${this.apiBase}/admin/posts/${id}`, body)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.editingPostId.set(null);
            this.isSavingPost.set(false);
            this.loadPosts(true);
          } else {
            this.postsError.set('Gagal menyimpan perubahan postingan');
            this.isSavingPost.set(false);
          }
        },
        error: () => {
          this.postsError.set('Gagal menyimpan perubahan postingan');
          this.isSavingPost.set(false);
        },
      });
  }

  deletePost(post: AdminPost): void {
    if (!confirm(`Hapus postingan dengan ID ${post.id}?`)) {
      return;
    }

    this.deletingPostId.set(post.id);
    this.postsError.set(null);

    this.http
      .delete<{ success: boolean }>(`${this.apiBase}/admin/posts/${post.id}`)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.deletingPostId.set(null);
            this.loadPosts(true);
          } else {
            this.postsError.set('Gagal menghapus postingan');
            this.deletingPostId.set(null);
          }
        },
        error: () => {
          this.postsError.set('Gagal menghapus postingan');
          this.deletingPostId.set(null);
        },
      });
  }

  private loadPosts(force = false): void {
    if (!force && this.posts() && !this.postsError()) {
      return;
    }

    this.isLoadingPosts.set(true);
    this.postsError.set(null);

    this.http
      .get<AdminPost[]>(`${this.apiBase}/admin/posts`)
      .subscribe({
        next: (data) => {
          this.posts.set(data);
          this.isLoadingPosts.set(false);
        },
        error: () => {
          this.postsError.set('Gagal memuat data postingan');
          this.isLoadingPosts.set(false);
        },
      });
  }

  deleteMedia(item: AdminMediaItem): void {
    if (!confirm(`Hapus media ${item.kind} dengan ID ${item.id}?`)) {
      return;
    }

    this.deletingMediaId.set(item.id);
    this.mediaError.set(null);

    this.http
      .delete<{ success: boolean }>(`${this.apiBase}/admin/media/${item.kind}/${item.id}`)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.deletingMediaId.set(null);
            this.loadMedia(true);
          } else {
            this.mediaError.set('Gagal menghapus media');
            this.deletingMediaId.set(null);
          }
        },
        error: () => {
          this.mediaError.set('Gagal menghapus media');
          this.deletingMediaId.set(null);
        },
      });
  }

  private loadMedia(force = false): void {
    if (!force && this.media() && !this.mediaError()) {
      return;
    }

    this.isLoadingMedia.set(true);
    this.mediaError.set(null);

    this.http
      .get<AdminMediaItem[]>(`${this.apiBase}/admin/media`)
      .subscribe({
        next: (data) => {
          this.media.set(data);
          this.isLoadingMedia.set(false);
        },
        error: () => {
          this.mediaError.set('Gagal memuat data media');
          this.isLoadingMedia.set(false);
        },
      });
  }

  startEditStory(story: AdminStory): void {
    this.editingStoryId.set(story.id);
    this.editStoryCaption.set(story.caption ?? '');
    this.storiesError.set(null);
  }

  cancelEditStory(): void {
    this.editingStoryId.set(null);
    this.isSavingStory.set(false);
  }

  saveStoryEdit(): void {
    const id = this.editingStoryId();
    if (!id) return;

    this.isSavingStory.set(true);
    this.storiesError.set(null);

    const body: Partial<AdminStory> = {
      caption: this.editStoryCaption().trim(),
    };

    this.http
      .patch<{ success: boolean }>(`${this.apiBase}/admin/stories/${id}`, body)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.editingStoryId.set(null);
            this.isSavingStory.set(false);
            this.loadStories(true);
          } else {
            this.storiesError.set('Gagal menyimpan perubahan story');
            this.isSavingStory.set(false);
          }
        },
        error: () => {
          this.storiesError.set('Gagal menyimpan perubahan story');
          this.isSavingStory.set(false);
        },
      });
  }

  deleteStory(story: AdminStory): void {
    if (!confirm(`Hapus story dengan ID ${story.id}?`)) {
      return;
    }

    this.deletingStoryId.set(story.id);
    this.storiesError.set(null);

    this.http
      .delete<{ success: boolean }>(`${this.apiBase}/admin/stories/${story.id}`)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.deletingStoryId.set(null);
            this.loadStories(true);
          } else {
            this.storiesError.set('Gagal menghapus story');
            this.deletingStoryId.set(null);
          }
        },
        error: () => {
          this.storiesError.set('Gagal menghapus story');
          this.deletingStoryId.set(null);
        },
      });
  }

  private loadStories(force = false): void {
    if (!force && this.stories() && !this.storiesError()) {
      return;
    }

    this.isLoadingStories.set(true);
    this.storiesError.set(null);

    this.http
      .get<AdminStory[]>(`${this.apiBase}/admin/stories`)
      .subscribe({
        next: (data) => {
          this.stories.set(data);
          this.isLoadingStories.set(false);
        },
        error: () => {
          this.storiesError.set('Gagal memuat data story');
          this.isLoadingStories.set(false);
        },
      });
  }

  startNewBlogPost(): void {
    this.editingBlogId.set(null);
    this.blogTitle.set('');
    this.blogSlug.set('');
    this.blogExcerpt.set('');
    this.blogCategory.set('ProductAndVision');
    this.blogReadTimeMinutes.set(5);
    this.blogPublishedAt.set('');
    this.blogAuthorName.set('');
    this.blogAuthorRole.set('');
    this.blogTagsInput.set('');
    this.blogStatus.set('DRAFT');
    this.blogBody.set('');
    this.slugAvailable.set(null);
    this.blogError.set(null);
  }

  startEditBlogPost(post: AdminBlogPost): void {
    this.editingBlogId.set(post.id);
    this.blogTitle.set(post.title);
    this.blogSlug.set(post.slug);
    this.blogExcerpt.set(post.excerpt);
    this.blogCategory.set(post.category);
    this.blogReadTimeMinutes.set(post.readTimeMinutes);
    this.blogPublishedAt.set(post.publishedAt ?? '');
    this.blogAuthorName.set(post.authorName);
    this.blogAuthorRole.set(post.authorRole);
    this.blogTagsInput.set((post.tags || []).join(', '));
    this.blogStatus.set(post.status);
    this.blogBody.set(post.body ?? '');
    this.slugAvailable.set(null);
    this.blogError.set(null);
  }

  generateBlogSlugFromTitle(): void {
    const title = this.blogTitle().trim();
    if (!title) {
      return;
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    this.blogSlug.set(slug);
    this.slugAvailable.set(null);
  }

  checkBlogSlugUnique(): void {
    const slug = this.blogSlug().trim();
    if (!slug) {
      return;
    }

    this.isCheckingSlug.set(true);
    this.slugAvailable.set(null);
    this.blogError.set(null);

    this.http
      .get<{ available: boolean }>(`${this.apiBase}/admin/blog/check-slug`, {
        params: { slug },
      })
      .subscribe({
        next: (res) => {
          this.slugAvailable.set(res.available);
          this.isCheckingSlug.set(false);
        },
        error: () => {
          this.blogError.set('Gagal memeriksa slug');
          this.isCheckingSlug.set(false);
        },
      });
  }

  saveBlogPost(): void {
    const slug = this.blogSlug().trim();
    const title = this.blogTitle().trim();
    const excerpt = this.blogExcerpt().trim();
    const authorName = this.blogAuthorName().trim();
    const authorRole = this.blogAuthorRole().trim();
    const readTime = Number(this.blogReadTimeMinutes() || 0);

    if (!slug || !title || !excerpt || !authorName || !authorRole || readTime <= 0) {
      this.blogError.set('Slug, judul, excerpt, nama & peran penulis, dan waktu baca wajib diisi.');
      return;
    }

    const publishedRaw = (this.blogPublishedAt() || '').trim();
    const tags = (this.blogTagsInput() || '')
      .split(',')
      .map((t) => t.trim())
      .filter((t) => !!t);

    const payload: AdminBlogPostPayload = {
      slug,
      title,
      excerpt,
      category: this.blogCategory(),
      readTimeMinutes: readTime,
      publishedAt: publishedRaw || null,
      authorName,
      authorRole,
      tags,
      status: this.blogStatus(),
      body: (this.blogBody() || '').trim() || null,
    };

    this.isSavingBlog.set(true);
    this.blogError.set(null);

    const id = this.editingBlogId();
    const request$ = id
      ? this.http.put<AdminBlogPost>(`${this.apiBase}/admin/blog/${id}`, payload)
      : this.http.post<AdminBlogPost>(`${this.apiBase}/admin/blog`, payload);

    request$.subscribe({
      next: () => {
        this.isSavingBlog.set(false);
        this.startNewBlogPost();
        this.loadBlogPosts(true);
      },
      error: (err) => {
        const msg =
          (err?.error && (err.error.message as string)) || 'Gagal menyimpan blog post';
        this.blogError.set(msg);
        this.isSavingBlog.set(false);
      },
    });
  }

  onBlogReadTimeInput(raw: string): void {
    const n = parseInt(raw, 10);
    this.blogReadTimeMinutes.set(Number.isNaN(n) ? 0 : n);
  }

  private loadBlogPosts(force = false): void {
    if (!force && this.blogPosts() && !this.blogError()) {
      return;
    }

    this.isLoadingBlog.set(true);
    this.blogError.set(null);

    this.http
      .get<AdminBlogPost[]>(`${this.apiBase}/admin/blog`)
      .subscribe({
        next: (data) => {
          this.blogPosts.set(data);
          this.isLoadingBlog.set(false);
        },
        error: () => {
          this.blogError.set('Gagal memuat data blog post');
          this.isLoadingBlog.set(false);
        },
      });
  }
}

interface AdminUser {
  id: string;
  email: string;
  namaLengkap: string;
  createdAt: string;
}

interface AdminPost {
  id: string;
  title: string | null;
  content: string;
  authorEmail: string;
  createdAt: string;
}

interface AdminMediaItem {
  id: string;
  kind: 'image' | 'video';
  url: string;
  postId: string;
  authorEmail: string;
  createdAt: string;
  duration: number | null;
}

interface AdminStory {
  id: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  type: string;
  userEmail: string;
  createdAt: string;
  expiresAt: string;
}

interface AdminBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: 'ProductAndVision' | 'Engineering' | 'Design' | 'Culture';
  readTimeMinutes: number;
  publishedAt: string | null;
  authorName: string;
  authorRole: string;
  tags: string[];
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  body: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminBlogPostPayload {
  slug: string;
  title: string;
  excerpt: string;
  category: 'ProductAndVision' | 'Engineering' | 'Design' | 'Culture';
  readTimeMinutes: number;
  publishedAt: string | null;
  authorName: string;
  authorRole: string;
  tags: string[];
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  body: string | null;
}
