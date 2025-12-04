"use client";

import { useState, useRef, useMemo } from "react";
import { X, Image as ImageIcon, Loader2, Type, Video, Tag, Play, Volume2, VolumeX } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api/client";
import useAuthStore from "@/store/auth";

import RichTextEditor from "@/components/common/RichTextEditor";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PostType = 'text' | 'image' | 'video';

const MAX_WORDS = 10_000;
const MAX_WORDS_LABEL = MAX_WORDS.toLocaleString('id-ID');

const countWords = (value: string) => {
  if (!value) return 0;
  const normalized = value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return 0;
  return normalized.split(/\s+/).length;
};

function VideoPreview({ url }: { url: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  return (
    <div className="relative w-full h-full">
      <video ref={ref} src={url} className="w-full h-full object-cover" loop muted={muted} playsInline />
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </div>
        </div>
      )}
      <button
        onClick={() => { if (!ref.current) return; if (playing) { ref.current.pause(); } else { ref.current.play(); } setPlaying(!playing); }}
        className="absolute inset-0"
        aria-label="Toggle play"
      />
      <button
        onClick={(e) => { e.stopPropagation(); if (!ref.current) return; ref.current.muted = !muted; setMuted(!muted); }}
        className="absolute bottom-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm"
        aria-label="Toggle mute"
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [activeTab, setActiveTab] = useState<PostType>('text');
  
  // Common State
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");

  // Media State
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPostingText, setIsPostingText] = useState(false);
  const [isPostingImage, setIsPostingImage] = useState(false);
  const [isPostingVideo, setIsPostingVideo] = useState(false);
  
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const textWordCount = useMemo(() => countWords(content), [content]);
  const descriptionWordCount = useMemo(() => countWords(description), [description]);

  const resetForm = () => {
    setContent("");
    setImageFiles([]);
    setImagePreviews([]);
    setVideoFile(null);
    setVideoPreview(null);
    setTitle("");
    setDescription("");
    setTags([]);
    setCurrentTag("");
    setUploadProgress(0);
  };

  const handleTextContentChange = (value: string) => {
    if (countWords(value) > MAX_WORDS) {
      toast.error(`Konten maksimal ${MAX_WORDS_LABEL} kata`);
      return;
    }
    setContent(value);
  };

  const handleDescriptionChange = (value: string) => {
    if (countWords(value) > MAX_WORDS) {
      toast.error(`Deskripsi maksimal ${MAX_WORDS_LABEL} kata`);
      return;
    }
    setDescription(value);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).filter(f => 
        ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(f.type)
      );
      if (selected.length !== e.target.files.length) {
        toast.error("Hanya JPG, PNG, dan WebP yang diizinkan");
      }
      setImageFiles(prev => [...prev, ...selected]);
      const previews = selected.map(f => URL.createObjectURL(f));
      setImagePreviews(prev => [...prev, ...previews]);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('video/')) {
        toast.error("File harus berupa video");
        return;
      }
      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Ukuran video maksimal 100MB");
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()]);
      }
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Submit Text Post
  const submitTextPost = async () => {
    const plainText = content.replace(/<[^>]+>/g, '').trim();
    if (!plainText && !title.trim()) {
      toast.error("Harap isi judul atau konten postingan");
      return;
    }

    if (countWords(plainText) > MAX_WORDS) {
      toast.error(`Konten teks maksimal ${MAX_WORDS_LABEL} kata`);
      return;
    }
    
    const fd = new FormData();
    fd.append('type', 'text');
    fd.append('content', content || title.trim());
    if (title.trim()) fd.append('title', title);
    tags.forEach(tag => fd.append('tags', tag));
    
    try {
      setIsPostingText(true);
      setIsUploading(true);
      await apiClient.post('/posts/text', fd, { 
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => { if(e.total) setUploadProgress(Math.round(e.loaded/e.total*100)); }
      });
      toast.success('Postingan berhasil dibagikan!');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.profile?.username] });
      resetForm();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Gagal memposting';
      toast.error(msg);
    } finally {
      setIsPostingText(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Submit Image Post
  const submitImagePost = async () => {
    if (imageFiles.length === 0) { 
      toast.error('Tambahkan setidaknya satu gambar'); 
      return; 
    }
    if (!description.trim() && !title.trim()) { 
      toast.error('Isi deskripsi atau judul untuk posting gambar'); 
      return; 
    }

    if (countWords(description) > MAX_WORDS) {
      toast.error(`Deskripsi gambar maksimal ${MAX_WORDS_LABEL} kata`);
      return;
    }
    
    const fd = new FormData();
    if (title.trim()) fd.append('title', title);
    fd.append('content', description.trim() || title.trim());
    tags.forEach(tag => fd.append('tags', tag));
    imageFiles.forEach(file => fd.append('images', file));
    
    try {
      setIsPostingImage(true);
      setIsUploading(true);
      await apiClient.post('/posts/images', fd, { 
        headers: { 'Content-Type': 'multipart/form-data' }, 
        timeout: 120000, 
        onUploadProgress: (e) => { if(e.total) setUploadProgress(Math.round(e.loaded/e.total*100)); } 
      });
      toast.success('Gambar berhasil diunggah!');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.profile?.username] });
      resetForm();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Gagal mengunggah gambar';
      toast.error(msg);
    } finally {
      setIsPostingImage(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Submit Video Post - INSTANT PREVIEW SYSTEM
  const submitVideoPost = async () => {
    if (!videoFile) { 
      toast.error('Tambahkan video terlebih dahulu'); 
      return; 
    }
    if (!description.trim() && !title.trim()) { 
      toast.error('Isi deskripsi atau judul untuk posting video'); 
      return; 
    }

    if (countWords(description) > MAX_WORDS) {
      toast.error(`Deskripsi video maksimal ${MAX_WORDS_LABEL} kata`);
      return;
    }
    
    const fd = new FormData();
    // Backend UploadVideoDto menerima: title, description, tags, videos
    if (title.trim()) fd.append('title', title);
    if (description.trim()) fd.append('description', description);
    // Append tags - each tag as separate field or as comma-separated string
    if (tags.length > 0) {
      tags.forEach(tag => fd.append('tags', tag));
    }
    fd.append('videos', videoFile); // Backend expects 'videos' field
    
    try {
      setIsPostingVideo(true);
      setIsUploading(true);
      
      // Upload to /videos/upload - instant preview endpoint
      const response = await apiClient.post('/videos/upload', fd, { 
        headers: { 'Content-Type': 'multipart/form-data' }, 
        timeout: 120000, // 2 minutes for upload (encoding happens in background)
        onUploadProgress: (e) => { if(e.total) setUploadProgress(Math.round(e.loaded/e.total*100)); } 
      });
      
      // Success! Video is READY instantly
      toast.success('Video berhasil diupload! 🎬 Video sudah bisa ditonton sekarang, kualitas akan ditingkatkan otomatis.', {
        duration: 5000,
        icon: '⚡',
      });
      
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.profile?.username] });
      resetForm();
      onClose();
    } catch (e: any) {
      console.error('Video upload error:', e);
      const msg = e?.response?.data?.message || e?.message || 'Gagal mengunggah video';
      toast.error(msg);
    } finally {
      setIsPostingVideo(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Get submit handler based on active tab
  const handleSubmit = () => {
    switch (activeTab) {
      case 'text':
        submitTextPost();
        break;
      case 'image':
        submitImagePost();
        break;
      case 'video':
        submitVideoPost();
        break;
    }
  };

  // Check if submit is disabled
  const isSubmitDisabled = () => {
    if (isUploading || isPostingText || isPostingImage || isPostingVideo) return true;
    
    switch (activeTab) {
      case 'text':
        const plainText = content.replace(/<[^>]+>/g, '').trim();
        return (!plainText && !title.trim()) || textWordCount > MAX_WORDS;
      case 'image':
        return (
          imageFiles.length === 0 ||
          (!description.trim() && !title.trim()) ||
          descriptionWordCount > MAX_WORDS
        );
      case 'video':
        return (
          !videoFile ||
          (!description.trim() && !title.trim()) ||
          descriptionWordCount > MAX_WORDS
        );
    }
  };

  // Get submit button text
  const getSubmitText = () => {
    const isLoading = isPostingText || isPostingImage || isPostingVideo;
    switch (activeTab) {
      case 'text':
        return isLoading ? 'Memposting...' : 'Bagikan';
      case 'image':
        return isLoading ? 'Mengunggah...' : 'Kirim Gambar';
      case 'video':
        return isLoading ? 'Mengunggah...' : 'Kirim Video';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Buat Postingan Baru</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs - 3 tabs: Text, Image, Video */}
        <div className="flex border-b border-slate-100 dark:border-slate-700">
          <button 
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'text' 
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Type className="w-4 h-4" />
            <span className="hidden sm:inline">Teks</span>
          </button>
          <button 
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'image' 
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Gambar</span>
          </button>
          <button 
            onClick={() => setActiveTab('video')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'video' 
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50/50 dark:bg-purple-900/20' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Video className="w-4 h-4" />
            <span className="hidden sm:inline">Video</span>
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1 bg-white dark:bg-slate-800">
          {/* User Info */}
          <div className="flex gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-600">
              {user?.profile?.profileImageUrl ? (
                <img src={user.profile.profileImageUrl} alt={user.profile.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  {(user?.profile?.username || user?.namaLengkap || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-slate-900 dark:text-white">{user?.profile?.username || "username"}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Posting ke Publik</p>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              {/* Title Input for Text Post */}
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul Artikel (Opsional)"
                className="w-full px-4 py-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xl font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              />

              <RichTextEditor 
                content={content} 
                onChange={handleTextContentChange} 
                placeholder="Mulai menulis cerita Anda..." 
              />
              <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                {textWordCount.toLocaleString('id-ID')} / {MAX_WORDS_LABEL} kata
              </div>
              
              {/* Tags Input */}
              <div className="relative">
                <div className="flex flex-wrap gap-2 p-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl min-h-[42px]">
                  {tags.map(tag => (
                    <span key={tag} className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-indigo-900 dark:hover:text-indigo-200"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  <input 
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder={tags.length === 0 ? "Tambah tags (tekan Enter)" : ""}
                    className="bg-transparent outline-none text-sm flex-1 min-w-[100px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <Tag className="absolute right-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
              </div>
            </div>
          )}

          {activeTab === 'image' && (
            <div className="space-y-4">
              {/* Title & Description */}
              <div className="space-y-3">
                <input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Judul Postingan"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400"
                />
                
                <textarea 
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Deskripsi gambar..."
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400"
                />
                <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                  {descriptionWordCount.toLocaleString('id-ID')} / {MAX_WORDS_LABEL} kata
                </div>

                {/* Tags Input */}
                <div className="relative">
                  <div className="flex flex-wrap gap-2 p-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl min-h-[42px]">
                    {tags.map(tag => (
                      <span key={tag} className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-emerald-900 dark:hover:text-emerald-200"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    <input 
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder={tags.length === 0 ? "Tambah tags (tekan Enter)" : ""}
                      className="bg-transparent outline-none text-sm flex-1 min-w-[100px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                  <Tag className="absolute right-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                </div>
              </div>

              {/* Image Upload Area */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  Gambar (JPG, PNG, WebP) - Maks 5MB per file
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviews.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group">
                      <img src={url} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeImage(idx)} 
                        className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => imageInputRef.current?.click()} 
                    className="aspect-square rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-emerald-600 transition-colors"
                  >
                    <ImageIcon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Upload</span>
                  </button>
                </div>
                <input 
                  ref={imageInputRef} 
                  type="file" 
                  accept="image/jpeg,image/png,image/jpg,image/webp" 
                  multiple 
                  className="hidden" 
                  onChange={handleImageChange} 
                />
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-4">
              {/* Title & Description */}
              <div className="space-y-3">
                <input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Judul Video"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400"
                />
                
                <textarea 
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Deskripsi video..."
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400"
                />
                <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                  {descriptionWordCount.toLocaleString('id-ID')} / {MAX_WORDS_LABEL} kata
                </div>

                {/* Tags Input */}
                <div className="relative">
                  <div className="flex flex-wrap gap-2 p-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl min-h-[42px]">
                    {tags.map(tag => (
                      <span key={tag} className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-purple-900 dark:hover:text-purple-200"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    <input 
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder={tags.length === 0 ? "Tambah tags (tekan Enter)" : ""}
                      className="bg-transparent outline-none text-sm flex-1 min-w-[100px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                  <Tag className="absolute right-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                </div>
              </div>

              {/* Video Upload Area */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-600" />
                  Video (MP4, WebM, MOV) - Maks 100MB
                </div>
                
                {videoPreview ? (
                  <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                    <VideoPreview url={videoPreview} />
                    <button 
                      onClick={removeVideo} 
                      className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm max-w-[200px] truncate">
                      {videoFile?.name}
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => videoInputRef.current?.click()} 
                    className="w-full aspect-video rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-purple-600 transition-colors"
                  >
                    <Video className="w-10 h-10 mb-2" />
                    <span className="text-sm font-medium">Klik untuk upload video</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">MP4, WebM, MOV - Maks 100MB</span>
                  </button>
                )}
                
                <input 
                  ref={videoInputRef} 
                  type="file" 
                  accept="video/mp4,video/webm,video/quicktime,video/*" 
                  className="hidden" 
                  onChange={handleVideoChange} 
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-3 bg-white dark:bg-slate-800">
          {/* Upload Progress */}
          {isUploading && uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${uploadProgress}%` }} 
                  className={`h-full transition-all duration-300 ${
                    activeTab === 'video' ? 'bg-purple-600' : 
                    activeTab === 'image' ? 'bg-emerald-600' : 'bg-indigo-600'
                  }`}
                />
              </div>
              <div className="text-xs text-slate-500 text-center">
                Mengunggah {uploadProgress}%
              </div>
            </div>
          )}
          
          {/* Submit Button */}
          <button 
            onClick={handleSubmit}
            disabled={isSubmitDisabled()}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'video' 
                ? 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
                : activeTab === 'image'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {(isPostingText || isPostingImage || isPostingVideo) && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {getSubmitText()}
          </button>
        </div>
      </div>
    </div>
  );
}
