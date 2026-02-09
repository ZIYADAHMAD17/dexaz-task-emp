-- Storage Bucket Setup for Avatars
-- Run this in your Supabase SQL Editor if it doesn't exist

-- 1. Create the bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Allow public access to read files
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- 3. Allow authenticated users to upload their own avatar
create policy "Allow Avatar Uploads"
on storage.objects for insert
with check (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- 4. Allow users to update their own avatar
create policy "Allow Avatar Updates"
on storage.objects for update
using (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
