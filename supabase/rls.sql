-- =============================================================================
-- KakeSo Row Level Security (RLS) ポリシー
-- =============================================================================
-- RLS = 「他人のデータは見せない・触らせない」をデータベース側で強制する仕組み。
-- これが無効だと、公開キー(anon key)を知っているだけで全ユーザーの家計データを
-- 誰でも取得できてしまう。公開前に必ずこのSQLを Supabase の SQL Editor で実行する。
--
-- 実行方法:
--   Supabase ダッシュボード → 左メニュー SQL Editor → New query →
--   このファイルの中身を全部貼り付け → Run
--
-- 何度実行しても安全（既存ポリシーを作り直すだけ）。
-- =============================================================================


-- ─── 1. 自分のデータだけ (本人のみ全操作可) ──────────────────────────────────
-- transactions / chat_messages / no_money_days / user_badges / budget_goals / surveys

alter table public.transactions   enable row level security;
alter table public.chat_messages  enable row level security;
alter table public.no_money_days  enable row level security;
alter table public.user_badges    enable row level security;
alter table public.budget_goals   enable row level security;
alter table public.surveys        enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'transactions','chat_messages','no_money_days','user_badges','budget_goals','surveys'
  ] loop
    execute format('drop policy if exists "own_rows_select" on public.%I', t);
    execute format('drop policy if exists "own_rows_insert" on public.%I', t);
    execute format('drop policy if exists "own_rows_update" on public.%I', t);
    execute format('drop policy if exists "own_rows_delete" on public.%I', t);

    execute format($f$create policy "own_rows_select" on public.%I
      for select using (auth.uid() = user_id)$f$, t);
    execute format($f$create policy "own_rows_insert" on public.%I
      for insert with check (auth.uid() = user_id)$f$, t);
    execute format($f$create policy "own_rows_update" on public.%I
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id)$f$, t);
    execute format($f$create policy "own_rows_delete" on public.%I
      for delete using (auth.uid() = user_id)$f$, t);
  end loop;
end $$;


-- ─── 2. profiles (全員が閲覧可 / 本人のみ作成・更新) ─────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;

create policy "profiles_select" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);


-- ─── 3. posts (全員が閲覧可 / 本人のみ投稿・編集・削除) ──────────────────────
alter table public.posts enable row level security;

drop policy if exists "posts_select" on public.posts;
drop policy if exists "posts_insert" on public.posts;
drop policy if exists "posts_update" on public.posts;
drop policy if exists "posts_delete" on public.posts;

create policy "posts_select" on public.posts
  for select using (auth.role() = 'authenticated');
create policy "posts_insert" on public.posts
  for insert with check (auth.uid() = user_id);
create policy "posts_update" on public.posts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "posts_delete" on public.posts
  for delete using (auth.uid() = user_id);


-- ─── 4. post_likes / post_comments (全員が閲覧可 / 本人のみ書き込み) ─────────
alter table public.post_likes    enable row level security;
alter table public.post_comments enable row level security;

do $$
declare t text;
begin
  foreach t in array array['post_likes','post_comments'] loop
    execute format('drop policy if exists "social_select" on public.%I', t);
    execute format('drop policy if exists "social_insert" on public.%I', t);
    execute format('drop policy if exists "social_delete" on public.%I', t);

    execute format($f$create policy "social_select" on public.%I
      for select using (auth.role() = 'authenticated')$f$, t);
    execute format($f$create policy "social_insert" on public.%I
      for insert with check (auth.uid() = user_id)$f$, t);
    execute format($f$create policy "social_delete" on public.%I
      for delete using (auth.uid() = user_id)$f$, t);
  end loop;
end $$;


-- ─── 5. follows (全員が閲覧可 / 自分がフォローする側のみ作成・削除) ──────────
alter table public.follows enable row level security;

drop policy if exists "follows_select" on public.follows;
drop policy if exists "follows_insert" on public.follows;
drop policy if exists "follows_delete" on public.follows;

create policy "follows_select" on public.follows
  for select using (auth.role() = 'authenticated');
create policy "follows_insert" on public.follows
  for insert with check (auth.uid() = follower_id);
create policy "follows_delete" on public.follows
  for delete using (auth.uid() = follower_id);


-- ─── 6. challenge_participants (全員が閲覧可 / 本人のみ参加・取消) ───────────
alter table public.challenge_participants enable row level security;

drop policy if exists "cp_select" on public.challenge_participants;
drop policy if exists "cp_insert" on public.challenge_participants;
drop policy if exists "cp_delete" on public.challenge_participants;

create policy "cp_select" on public.challenge_participants
  for select using (auth.role() = 'authenticated');
create policy "cp_insert" on public.challenge_participants
  for insert with check (auth.uid() = user_id);
create policy "cp_delete" on public.challenge_participants
  for delete using (auth.uid() = user_id);


-- ─── 7. challenges (全員が閲覧のみ / 書き込みはサーバー専用キーのみ) ─────────
-- challenges はシステムが作るもの。ユーザーは読むだけ。
-- INSERT/UPDATE/DELETE ポリシーを作らない = 一般ユーザーは書き込み不可。
-- (service role key はRLSを無視するので、管理側の作成はそのまま可能)
alter table public.challenges enable row level security;

drop policy if exists "challenges_select" on public.challenges;
create policy "challenges_select" on public.challenges
  for select using (auth.role() = 'authenticated');


-- =============================================================================
-- 実行後の確認方法:
--   Supabase → Table Editor で各テーブルを開き、右上に "RLS enabled" と
--   緑で表示されていればOK。
--   さらに Authentication → Policies で上記ポリシーが並んでいるか確認する。
-- =============================================================================
