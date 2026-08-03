--
-- GymAtlas Database Schema
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- profiles (replaces users, auth handled by Supabase)
-- =============================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    username character varying(50) UNIQUE,
    role text NOT NULL DEFAULT 'user'::text,
    created_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.profiles OWNER TO postgres;

-- =============================================
-- equipment_categories
-- =============================================

CREATE TABLE public.equipment_categories (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    type text NOT NULL
);

ALTER TABLE public.equipment_categories OWNER TO postgres;

CREATE SEQUENCE public.equipment_categories_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.equipment_categories_id_seq OWNER TO postgres;
ALTER SEQUENCE public.equipment_categories_id_seq OWNED BY public.equipment_categories.id;
ALTER TABLE ONLY public.equipment_categories ALTER COLUMN id SET DEFAULT nextval('public.equipment_categories_id_seq'::regclass);
ALTER TABLE ONLY public.equipment_categories ADD CONSTRAINT equipment_categories_pkey PRIMARY KEY (id);

-- =============================================
-- equipment
-- =============================================

CREATE TABLE public.equipment (
    id integer NOT NULL,
    brand text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    type text,
    created_at timestamp without time zone DEFAULT now(),
    series text,
    image_url text,
    status text NOT NULL DEFAULT 'approved'::text,
    created_by UUID,
    resistance_profile text DEFAULT 'constant'::text,
    pending_image_url text,
    photo_status text,
    photo_uploaded_by UUID,
    photo_uploaded_at timestamp without time zone,
    weight_stack integer,
    pending_weight_stack integer,
    weight_stack_status text,
    weight_stack_submitted_by UUID
);

ALTER TABLE public.equipment OWNER TO postgres;

CREATE SEQUENCE public.equipment_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.equipment_id_seq OWNER TO postgres;
ALTER SEQUENCE public.equipment_id_seq OWNED BY public.equipment.id;
ALTER TABLE ONLY public.equipment ALTER COLUMN id SET DEFAULT nextval('public.equipment_id_seq'::regclass);
ALTER TABLE ONLY public.equipment ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);

-- =============================================
-- gyms
-- =============================================

CREATE TABLE public.gyms (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    address text,
    city text,
    country text,
    latitude double precision,
    longitude double precision,
    created_at timestamp without time zone DEFAULT now(),
    instagram character varying(255),
    image_url text,
    status text NOT NULL DEFAULT 'approved'::text,
    created_by UUID,
    pending_image_url text,
    photo_status text,
    photo_uploaded_by UUID,
    photo_uploaded_at timestamp without time zone
);

ALTER TABLE public.gyms OWNER TO postgres;

CREATE SEQUENCE public.gyms_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.gyms_id_seq OWNER TO postgres;
ALTER SEQUENCE public.gyms_id_seq OWNED BY public.gyms.id;
ALTER TABLE ONLY public.gyms ALTER COLUMN id SET DEFAULT nextval('public.gyms_id_seq'::regclass);
ALTER TABLE ONLY public.gyms ADD CONSTRAINT gyms_pkey PRIMARY KEY (id);

-- =============================================
-- gym_equipment
-- =============================================

CREATE TABLE public.gym_equipment (
    id integer NOT NULL,
    gym_id integer NOT NULL,
    equipment_id integer NOT NULL,
    quantity integer DEFAULT 1,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    status text DEFAULT 'approved'::text,
    created_by UUID
);

ALTER TABLE public.gym_equipment OWNER TO postgres;

CREATE SEQUENCE public.gym_equipment_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.gym_equipment_id_seq OWNER TO postgres;
ALTER SEQUENCE public.gym_equipment_id_seq OWNED BY public.gym_equipment.id;
ALTER TABLE ONLY public.gym_equipment ALTER COLUMN id SET DEFAULT nextval('public.gym_equipment_id_seq'::regclass);
ALTER TABLE ONLY public.gym_equipment ADD CONSTRAINT gym_equipment_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.gym_equipment ADD CONSTRAINT gym_equipment_gym_id_equipment_id_key UNIQUE (gym_id, equipment_id);

-- =============================================
-- gym_free_weights
-- =============================================

CREATE TABLE public.gym_free_weights (
    gym_id integer NOT NULL,
    dumbbell_min_kg integer,
    dumbbell_max_kg integer,
    dumbbell_racks integer NOT NULL DEFAULT 0,
    squat_racks integer NOT NULL DEFAULT 0,
    flat_benches integer NOT NULL DEFAULT 0,
    incline_benches integer NOT NULL DEFAULT 0,
    platforms integer NOT NULL DEFAULT 0,
    preacher_curl_stations integer NOT NULL DEFAULT 0,
    verified boolean NOT NULL DEFAULT false,
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_by UUID,
    CONSTRAINT gym_free_weights_dumbbell_min_check CHECK (dumbbell_min_kg IS NULL OR dumbbell_min_kg BETWEEN 0 AND 999),
    CONSTRAINT gym_free_weights_dumbbell_max_check CHECK (dumbbell_max_kg IS NULL OR dumbbell_max_kg BETWEEN 0 AND 999),
    CONSTRAINT gym_free_weights_dumbbell_range_check CHECK (dumbbell_min_kg IS NULL OR dumbbell_max_kg IS NULL OR dumbbell_max_kg >= dumbbell_min_kg),
    CONSTRAINT gym_free_weights_counts_check CHECK (dumbbell_racks BETWEEN 0 AND 999 AND squat_racks BETWEEN 0 AND 999 AND flat_benches BETWEEN 0 AND 999 AND incline_benches BETWEEN 0 AND 999 AND platforms BETWEEN 0 AND 999 AND preacher_curl_stations BETWEEN 0 AND 999)
);

ALTER TABLE public.gym_free_weights OWNER TO postgres;
ALTER TABLE ONLY public.gym_free_weights ADD CONSTRAINT gym_free_weights_pkey PRIMARY KEY (gym_id);

-- =============================================
-- gym_free_weight_suggestions
-- =============================================

CREATE TABLE public.gym_free_weight_suggestions (
    id integer NOT NULL,
    gym_id integer NOT NULL,
    dumbbell_min_kg integer,
    dumbbell_max_kg integer,
    dumbbell_racks integer NOT NULL DEFAULT 0,
    squat_racks integer NOT NULL DEFAULT 0,
    flat_benches integer NOT NULL DEFAULT 0,
    incline_benches integer NOT NULL DEFAULT 0,
    platforms integer NOT NULL DEFAULT 0,
    preacher_curl_stations integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'pending'::text,
    submitted_by UUID,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT gym_free_weight_suggestions_status_check CHECK (status IN ('pending', 'approved', 'rejected')),
    CONSTRAINT gym_free_weight_suggestions_dumbbell_min_check CHECK (dumbbell_min_kg IS NULL OR dumbbell_min_kg BETWEEN 0 AND 999),
    CONSTRAINT gym_free_weight_suggestions_dumbbell_max_check CHECK (dumbbell_max_kg IS NULL OR dumbbell_max_kg BETWEEN 0 AND 999),
    CONSTRAINT gym_free_weight_suggestions_dumbbell_range_check CHECK (dumbbell_min_kg IS NULL OR dumbbell_max_kg IS NULL OR dumbbell_max_kg >= dumbbell_min_kg),
    CONSTRAINT gym_free_weight_suggestions_counts_check CHECK (dumbbell_racks BETWEEN 0 AND 999 AND squat_racks BETWEEN 0 AND 999 AND flat_benches BETWEEN 0 AND 999 AND incline_benches BETWEEN 0 AND 999 AND platforms BETWEEN 0 AND 999 AND preacher_curl_stations BETWEEN 0 AND 999)
);

ALTER TABLE public.gym_free_weight_suggestions OWNER TO postgres;

CREATE SEQUENCE public.gym_free_weight_suggestions_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.gym_free_weight_suggestions_id_seq OWNER TO postgres;
ALTER SEQUENCE public.gym_free_weight_suggestions_id_seq OWNED BY public.gym_free_weight_suggestions.id;
ALTER TABLE ONLY public.gym_free_weight_suggestions ALTER COLUMN id SET DEFAULT nextval('public.gym_free_weight_suggestions_id_seq'::regclass);
ALTER TABLE ONLY public.gym_free_weight_suggestions ADD CONSTRAINT gym_free_weight_suggestions_pkey PRIMARY KEY (id);
CREATE INDEX idx_gym_free_weight_suggestions_pending ON public.gym_free_weight_suggestions USING btree (created_at DESC) WHERE status = 'pending';
CREATE UNIQUE INDEX idx_gym_free_weight_suggestions_pending_user ON public.gym_free_weight_suggestions USING btree (gym_id, submitted_by) WHERE status = 'pending';

-- =============================================
-- gym_favourites
-- =============================================

CREATE TABLE public.gym_favourites (
    user_id UUID,
    gym_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.gym_favourites OWNER TO postgres;

-- =============================================
-- gym_ratings
-- =============================================

CREATE TABLE public.gym_ratings (
    user_id UUID,
    gym_id integer NOT NULL,
    rating integer,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT gym_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);

ALTER TABLE public.gym_ratings OWNER TO postgres;

CREATE UNIQUE INDEX one_rating_per_user ON public.gym_ratings USING btree (user_id, gym_id);

-- =============================================
-- equipment_favourites
-- =============================================

CREATE TABLE public.equipment_favourites (
    user_id UUID,
    equipment_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT equipment_favourites_user_equipment_unique UNIQUE (user_id, equipment_id)
);

ALTER TABLE public.equipment_favourites OWNER TO postgres;

-- =============================================
-- equipment_ratings
-- =============================================

CREATE TABLE public.equipment_ratings (
    user_id UUID,
    equipment_id integer NOT NULL,
    rating integer,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT equipment_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT unique_user_equipment UNIQUE (user_id, equipment_id)
);

ALTER TABLE public.equipment_ratings OWNER TO postgres;

-- =============================================
-- notifications
-- =============================================

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id UUID,
    type text NOT NULL,
    message text NOT NULL,
    related_id integer,
    read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.notifications OWNER TO postgres;

CREATE SEQUENCE public.notifications_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;
ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;
ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id, read, created_at DESC);

-- =============================================
-- user_best_in_class
-- =============================================

CREATE TABLE public.user_best_in_class (
    id integer NOT NULL,
    user_id UUID,
    category_id integer,
    equipment_id integer,
    created_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.user_best_in_class OWNER TO postgres;

CREATE SEQUENCE public.user_best_in_class_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.user_best_in_class_id_seq OWNER TO postgres;
ALTER SEQUENCE public.user_best_in_class_id_seq OWNED BY public.user_best_in_class.id;
ALTER TABLE ONLY public.user_best_in_class ALTER COLUMN id SET DEFAULT nextval('public.user_best_in_class_id_seq'::regclass);
ALTER TABLE ONLY public.user_best_in_class ADD CONSTRAINT user_best_in_class_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_best_in_class ADD CONSTRAINT user_best_in_class_user_id_category_id_key UNIQUE (user_id, category_id);

-- =============================================
-- Foreign Key Constraints
-- =============================================

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE ONLY public.gyms
    ADD CONSTRAINT gyms_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE ONLY public.gym_equipment
    ADD CONSTRAINT gym_equipment_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.gym_equipment
    ADD CONSTRAINT gym_equipment_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.gym_equipment
    ADD CONSTRAINT gym_equipment_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE ONLY public.gym_free_weights
    ADD CONSTRAINT gym_free_weights_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.gym_free_weights
    ADD CONSTRAINT gym_free_weights_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.gym_free_weight_suggestions
    ADD CONSTRAINT gym_free_weight_suggestions_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.gym_free_weight_suggestions
    ADD CONSTRAINT gym_free_weight_suggestions_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.gym_favourites
    ADD CONSTRAINT gym_favourites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.gym_favourites
    ADD CONSTRAINT gym_favourites_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.gym_ratings
    ADD CONSTRAINT gym_ratings_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.gym_ratings
    ADD CONSTRAINT gym_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE ONLY public.equipment_favourites
    ADD CONSTRAINT equipment_favourites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.equipment_favourites
    ADD CONSTRAINT equipment_favourites_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.equipment_ratings
    ADD CONSTRAINT equipment_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE ONLY public.equipment_ratings
    ADD CONSTRAINT equipment_ratings_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_best_in_class
    ADD CONSTRAINT user_best_in_class_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_best_in_class
    ADD CONSTRAINT user_best_in_class_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.equipment_categories(id);

ALTER TABLE ONLY public.user_best_in_class
    ADD CONSTRAINT user_best_in_class_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);

ALTER TABLE public.gym_free_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_free_weight_suggestions ENABLE ROW LEVEL SECURITY;
