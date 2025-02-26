-- Enable Row Level Security
alter table public.events enable row level security;

-- Create policies for public access
create policy "Allow public read access on events"
  on public.events for select
  using (true);

create policy "Allow public insert access on events"
  on public.events for insert
  with check (true);

