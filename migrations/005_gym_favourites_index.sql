CREATE UNIQUE INDEX gym_favourites_user_gym_unique
  ON public.gym_favourites USING btree (user_id, gym_id);
