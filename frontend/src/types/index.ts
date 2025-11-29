// User Types
export interface User {
  id: string;
  email: string;
  namaLengkap: string;
  isEmailVerified: boolean;
  createdAt: string;
  profile?: Profile;
}

export interface Profile {
  username: string;
  profileImageUrl: string | null;
  umur: number;
  tanggalLahir: string;
  tempatKelahiran: string;
  isOnboardingComplete: boolean;
}

// Auth Types
export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RegisterData {
  namaLengkap: string;
  email: string;
  password: string;
}

// Post Types
export interface Post {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    namaLengkap: string;
    profile?: {
      username: string;
      profileImageUrl: string | null;
    };
  };
  images: PostImage[];
  _count: {
    likes: number;
    comments: number;
    bookmarks: number;
  };
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface PostImage {
  id: string;
  url: string;
  createdAt: string;
}

// Comment Types
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    namaLengkap: string;
    profile?: {
      username: string;
      profileImageUrl: string | null;
    };
  };
  replies?: Comment[];
  _count?: {
    replies: number;
  };
}

// Notification Types
export interface Notification {
  id: string;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MENTION';
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
  actor?: {
    id: string;
    namaLengkap: string;
    profile?: {
      username: string;
      profileImageUrl: string | null;
    };
  };
}

// Story Types
export interface Story {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  caption: string | null;
  expiresAt: string;
  createdAt: string;
  user: {
    id: string;
    namaLengkap: string;
    profile?: {
      username: string;
      profileImageUrl: string | null;
    };
  };
  _count: {
    views: number;
  };
}

// Message Types
export interface Conversation {
  id: string;
  isGroup: boolean;
  name: string | null;
  participants: {
    user: {
      id: string;
      namaLengkap: string;
      profile?: {
        username: string;
        profileImageUrl: string | null;
      };
    };
  }[];
  lastMessage?: Message;
  lastMessageAt: string | null;
}

export interface Message {
  id: string;
  content: string;
  mediaUrl: string | null;
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  sender: {
    id: string;
    namaLengkap: string;
    profile?: {
      username: string;
      profileImageUrl: string | null;
    };
  };
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
