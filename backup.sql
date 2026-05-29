--
-- PostgreSQL database dump
--

\restrict XywCv7rqOBno7V3CYvLNSl8p0u1gq7avIYWcIFExfT4am3iUUQCAf2V4hLPN3nH

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

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

--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menu_items (
    id integer NOT NULL,
    restaurant_id integer NOT NULL,
    name text NOT NULL,
    name_al text,
    name_mk text,
    description text,
    description_al text,
    description_mk text,
    price text NOT NULL,
    category text DEFAULT 'Main'::text NOT NULL,
    image_url text,
    active boolean DEFAULT true NOT NULL,
    is_vegetarian boolean DEFAULT false NOT NULL,
    is_vegan boolean DEFAULT false NOT NULL,
    is_gluten_free boolean DEFAULT false NOT NULL,
    is_spicy boolean DEFAULT false NOT NULL,
    is_contains_nuts boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.menu_items OWNER TO postgres;

--
-- Name: menu_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.menu_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_items_id_seq OWNER TO postgres;

--
-- Name: menu_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.menu_items_id_seq OWNED BY public.menu_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    restaurant_id integer NOT NULL,
    table_number integer NOT NULL,
    cart text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    waiter_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: page_views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.page_views (
    id integer NOT NULL,
    restaurant_id integer NOT NULL,
    viewed_at timestamp without time zone DEFAULT now() NOT NULL,
    date_str text NOT NULL
);


ALTER TABLE public.page_views OWNER TO postgres;

--
-- Name: page_views_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.page_views_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.page_views_id_seq OWNER TO postgres;

--
-- Name: page_views_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.page_views_id_seq OWNED BY public.page_views.id;


--
-- Name: restaurants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.restaurants (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    description_al text,
    description_mk text,
    user_id integer NOT NULL,
    photo_url text,
    website text,
    phone_number text,
    location text,
    opening_time text DEFAULT '08:00'::text,
    closing_time text DEFAULT '22:00'::text,
    active boolean DEFAULT true NOT NULL,
    latitude double precision,
    longitude double precision,
    table_count integer DEFAULT 0 NOT NULL,
    wifi_password text,
    order_mode text DEFAULT 'whatsapp'::text NOT NULL
);


ALTER TABLE public.restaurants OWNER TO postgres;

--
-- Name: restaurants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.restaurants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.restaurants_id_seq OWNER TO postgres;

--
-- Name: restaurants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.restaurants_id_seq OWNED BY public.restaurants.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: waiters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.waiters (
    id integer NOT NULL,
    restaurant_id integer NOT NULL,
    name text NOT NULL,
    pin_code text NOT NULL
);


ALTER TABLE public.waiters OWNER TO postgres;

--
-- Name: waiters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.waiters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.waiters_id_seq OWNER TO postgres;

--
-- Name: waiters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.waiters_id_seq OWNED BY public.waiters.id;


--
-- Name: menu_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items ALTER COLUMN id SET DEFAULT nextval('public.menu_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: page_views id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.page_views ALTER COLUMN id SET DEFAULT nextval('public.page_views_id_seq'::regclass);


--
-- Name: restaurants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurants ALTER COLUMN id SET DEFAULT nextval('public.restaurants_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: waiters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waiters ALTER COLUMN id SET DEFAULT nextval('public.waiters_id_seq'::regclass);


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.menu_items (id, restaurant_id, name, name_al, name_mk, description, description_al, description_mk, price, category, image_url, active, is_vegetarian, is_vegan, is_gluten_free, is_spicy, is_contains_nuts, sort_order) FROM stdin;
1	1	Pizza Margherita	\N	\N	Tomato sauce, mozzarella, basil	\N	\N	500 DEN	Food	\N	t	f	f	f	f	f	0
2	1	Classic Burger	\N	\N	Beef patty, lettuce, tomato, house sauce	\N	\N	350 DEN	Food	\N	t	f	f	f	f	f	1
3	1	Coca-Cola	\N	\N	330ml can	\N	\N	100 DEN	Drinks	\N	t	f	f	f	f	f	2
4	2	Grilled Chicken	\N	\N	Served with fries and salad	\N	\N	450 DEN	Mains	\N	t	f	f	f	f	f	3
5	2	Qebapa (10 pcs)	\N	\N	Traditional minced meat rolls with bread	\N	\N	300 DEN	Mains	\N	t	f	f	f	f	f	4
6	2	Ayran	\N	\N	Refreshing yogurt drink	\N	\N	60 DEN	Drinks	\N	t	f	f	f	f	f	5
7	3	Espresso	\N	\N	Strong and rich	\N	\N	80 DEN	Coffee	\N	t	f	f	f	f	f	6
8	3	Cappuccino	\N	\N	Espresso with steamed milk foam	\N	\N	120 DEN	Coffee	\N	t	f	f	f	f	f	7
9	3	Cheesecake	\N	\N	New York style with berry topping	\N	\N	250 DEN	Dessert	\N	t	f	f	f	f	f	8
10	4	test	test	test	test	test	test	350 DEN	Mains		t	f	f	f	f	f	0
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, restaurant_id, table_number, cart, status, waiter_id, created_at) FROM stdin;
1	4	1	[{"id":10,"name":"test","price":350,"qty":4,"addedBy":"h4bad922"}]	completed	3	2026-05-06 01:13:05.099149
2	4	1	[{"id":10,"name":"test","price":350,"qty":1,"addedBy":"h4bad922"}]	claimed	3	2026-05-06 01:24:53.373433
\.


--
-- Data for Name: page_views; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.page_views (id, restaurant_id, viewed_at, date_str) FROM stdin;
1	2	2026-03-16 04:08:04.464423	2026-03-16
2	1	2026-03-16 04:18:47.232357	2026-03-16
\.


--
-- Data for Name: restaurants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.restaurants (id, name, slug, description, description_al, description_mk, user_id, photo_url, website, phone_number, location, opening_time, closing_time, active, latitude, longitude, table_count, wifi_password, order_mode) FROM stdin;
2	Hajde Grill	hajde-grill	Best grilled meats and traditional qebapa.	\N	\N	2	https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80	https://hajdegrill.mk	+389 44 234 567	Bulevardi Iliria, Tetovë 1200	08:00	22:00	t	42.008	20.965	0	\N	whatsapp
3	Cafe Hajde	cafe-hajde	Premium coffee and delightful desserts.	\N	\N	3	https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80	https://cafehajde.mk	+389 44 345 678	Sheshi Iliria, Tetovë 1200	08:00	22:00	t	42.012	20.972	0	\N	whatsapp
4	test	test		\N	\N	1				test	08:00	22:00	t	0	0	1	\N	tablet
1	Test	test-restaurant-tetove	Authentic local cuisine in the heart of Tetovo.	\N	\N	1	https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80	https://test-restaurant.mk	+389 44 123 456	Rruga e Marshit, Tetovë 1200	08:00	22:00	t	42.01	20.97	1	\N	tablet
6	test	test1		\N	\N	1				test	08:00	22:00	t	0	0	0	\N	whatsapp
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password) FROM stdin;
1	hajdeha	47109f9b4e0dafc6fb3f0729771cc3a0:72bf640d258c5c638ee8170d3602ad76fc378fa2bcb496848e8d0d813cf1714d65c3de909f323dc818fc85ea68ff0addc32c6694d9acbed65ee7e77551fa7ee5
2	admin2	f8e06833b575ffb952b0b078ddc88231:0583587a86452657c058e1f2c60516f9a593f7ac9634a56d070f09744252f0a2faa4f9b4168feed841569011b707a452d3b049c6d1d2b81038adbd1e37bdc28b
3	admin3	7fa5ac89511c21f78aa49c8d9530657f:73ea92ded0bd21f6e9cad4208b59e6b0fe0a853229f4a033da283a6a22610cc32c03ea60ace8f7805be7268872ad3c974e675cd353d0e11fe56530065158140a
\.


--
-- Data for Name: waiters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.waiters (id, restaurant_id, name, pin_code) FROM stdin;
1	1	EGZON	111
2	1	test	222
3	4	egzon	111
\.


--
-- Name: menu_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.menu_items_id_seq', 10, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 2, true);


--
-- Name: page_views_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.page_views_id_seq', 2, true);


--
-- Name: restaurants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.restaurants_id_seq', 6, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: waiters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.waiters_id_seq', 3, true);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: page_views page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);


--
-- Name: restaurants restaurants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_pkey PRIMARY KEY (id);


--
-- Name: restaurants restaurants_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_slug_unique UNIQUE (slug);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: waiters waiters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waiters
    ADD CONSTRAINT waiters_pkey PRIMARY KEY (id);


--
-- Name: pv_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pv_date_idx ON public.page_views USING btree (date_str);


--
-- Name: pv_restaurant_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pv_restaurant_id_idx ON public.page_views USING btree (restaurant_id);


--
-- Name: restaurant_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX restaurant_id_idx ON public.menu_items USING btree (restaurant_id);


--
-- Name: slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX slug_idx ON public.restaurants USING btree (slug);


--
-- Name: menu_items menu_items_restaurant_id_restaurants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_restaurant_id_restaurants_id_fk FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: orders orders_restaurant_id_restaurants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_restaurant_id_restaurants_id_fk FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: orders orders_waiter_id_waiters_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_waiter_id_waiters_id_fk FOREIGN KEY (waiter_id) REFERENCES public.waiters(id);


--
-- Name: page_views page_views_restaurant_id_restaurants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_restaurant_id_restaurants_id_fk FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: restaurants restaurants_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: waiters waiters_restaurant_id_restaurants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waiters
    ADD CONSTRAINT waiters_restaurant_id_restaurants_id_fk FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict XywCv7rqOBno7V3CYvLNSl8p0u1gq7avIYWcIFExfT4am3iUUQCAf2V4hLPN3nH

