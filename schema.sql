--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-07-20 20:11:21

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16546)
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- TOC entry 4367 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- TOC entry 325 (class 1255 OID 16874)
-- Name: proc_create_account_and_user(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.proc_create_account_and_user(p_email text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_account_id INTEGER;
BEGIN
    -- Insert into account and get the new id
    INSERT INTO account(username, role_id, display_name)
    VALUES (p_email, 1, p_email)
    RETURNING id INTO new_account_id;

    -- Insert into "user" using that id
    INSERT INTO "user"(id, email, password)
    SELECT new_account_id, email, password
    FROM temp_user
    WHERE email = p_email;
END;
$$;


ALTER FUNCTION public.proc_create_account_and_user(p_email text) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 218 (class 1259 OID 16875)
-- Name: account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account (
    id integer NOT NULL,
    username character varying(200),
    role_id integer,
    display_name character varying(200)
);


ALTER TABLE public.account OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16878)
-- Name: account_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.account_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.account_id_seq OWNER TO postgres;

--
-- TOC entry 4368 (class 0 OID 0)
-- Dependencies: 219
-- Name: account_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.account_id_seq OWNED BY public.account.id;


--
-- TOC entry 220 (class 1259 OID 16879)
-- Name: admin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin (
    id integer NOT NULL,
    password character varying(200)
);


ALTER TABLE public.admin OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16882)
-- Name: admin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_id_seq OWNER TO postgres;

--
-- TOC entry 4369 (class 0 OID 0)
-- Dependencies: 221
-- Name: admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_id_seq OWNED BY public.admin.id;


--
-- TOC entry 256 (class 1259 OID 17176)
-- Name: ai_agent_resources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_agent_resources (
    id integer NOT NULL,
    name character varying(100),
    ip character varying(20),
    ocr_in_used boolean
);


ALTER TABLE public.ai_agent_resources OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 17175)
-- Name: ai_agent_resources_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ai_agent_resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_agent_resources_id_seq OWNER TO postgres;

--
-- TOC entry 4370 (class 0 OID 0)
-- Dependencies: 255
-- Name: ai_agent_resources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ai_agent_resources_id_seq OWNED BY public.ai_agent_resources.id;


--
-- TOC entry 222 (class 1259 OID 16883)
-- Name: brand; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brand (
    id integer NOT NULL,
    label character varying(50),
    homepage_ref character varying(500),
    description text
);


ALTER TABLE public.brand OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16888)
-- Name: brand_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.brand_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.brand_id_seq OWNER TO postgres;

--
-- TOC entry 4371 (class 0 OID 0)
-- Dependencies: 223
-- Name: brand_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.brand_id_seq OWNED BY public.brand.id;


--
-- TOC entry 250 (class 1259 OID 17123)
-- Name: conversation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversation (
    id text NOT NULL,
    account_id integer,
    title text,
    created_time timestamp without time zone,
    updated_time timestamp without time zone
);


ALTER TABLE public.conversation OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 17122)
-- Name: conversation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conversation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversation_id_seq OWNER TO postgres;

--
-- TOC entry 4372 (class 0 OID 0)
-- Dependencies: 249
-- Name: conversation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conversation_id_seq OWNED BY public.conversation.id;


--
-- TOC entry 224 (class 1259 OID 16889)
-- Name: device; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.device (
    id integer NOT NULL,
    description text,
    details_ref character varying(500),
    device_type_id integer,
    brand_id integer,
    label character varying(50)
);


ALTER TABLE public.device OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 17286)
-- Name: device_conversation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.device_conversation (
    device_id integer NOT NULL,
    conversation_id text NOT NULL
);


ALTER TABLE public.device_conversation OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16894)
-- Name: device_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.device_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.device_id_seq OWNER TO postgres;

--
-- TOC entry 4373 (class 0 OID 0)
-- Dependencies: 225
-- Name: device_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.device_id_seq OWNED BY public.device.id;


--
-- TOC entry 226 (class 1259 OID 16895)
-- Name: device_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.device_type (
    id integer NOT NULL,
    description text,
    wiki_ref character varying(500),
    label character varying(50)
);


ALTER TABLE public.device_type OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16900)
-- Name: device_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.device_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.device_type_id_seq OWNER TO postgres;

--
-- TOC entry 4374 (class 0 OID 0)
-- Dependencies: 227
-- Name: device_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.device_type_id_seq OWNED BY public.device_type.id;


--
-- TOC entry 228 (class 1259 OID 16901)
-- Name: google_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.google_user (
    id integer NOT NULL,
    google_id text
);


ALTER TABLE public.google_user OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16906)
-- Name: google_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.google_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.google_user_id_seq OWNER TO postgres;

--
-- TOC entry 4375 (class 0 OID 0)
-- Dependencies: 229
-- Name: google_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.google_user_id_seq OWNED BY public.google_user.id;


--
-- TOC entry 253 (class 1259 OID 17138)
-- Name: note; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.note (
    id integer NOT NULL,
    title text
);


ALTER TABLE public.note OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16907)
-- Name: pdf; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pdf (
    id integer NOT NULL,
    gcs_bucket character varying(100),
    device_id integer,
    ocr_flag boolean,
    filename character varying(100),
    number_of_pages integer,
    uploaded_at timestamp without time zone,
    last_access timestamp without time zone
);


ALTER TABLE public.pdf OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16910)
-- Name: pdf_chunk; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pdf_chunk (
    id integer NOT NULL,
    embedding public.vector(768),
    context text
);


ALTER TABLE public.pdf_chunk OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16915)
-- Name: pdf_chunk_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pdf_chunk_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pdf_chunk_id_seq OWNER TO postgres;

--
-- TOC entry 4376 (class 0 OID 0)
-- Dependencies: 232
-- Name: pdf_chunk_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pdf_chunk_id_seq OWNED BY public.pdf_chunk.id;


--
-- TOC entry 233 (class 1259 OID 16916)
-- Name: pdf_chunk_pdf_image; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pdf_chunk_pdf_image (
    id integer NOT NULL,
    pdf_chunk_id integer,
    pdf_image_id integer
);


ALTER TABLE public.pdf_chunk_pdf_image OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 16919)
-- Name: pdf_chunk_pdf_image_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pdf_chunk_pdf_image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pdf_chunk_pdf_image_id_seq OWNER TO postgres;

--
-- TOC entry 4377 (class 0 OID 0)
-- Dependencies: 234
-- Name: pdf_chunk_pdf_image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pdf_chunk_pdf_image_id_seq OWNED BY public.pdf_chunk_pdf_image.id;


--
-- TOC entry 235 (class 1259 OID 16920)
-- Name: pdf_chunk_pdf_paragraph; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pdf_chunk_pdf_paragraph (
    id integer NOT NULL,
    pdf_chunk_id integer,
    pdf_paragraph_id integer
);


ALTER TABLE public.pdf_chunk_pdf_paragraph OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16923)
-- Name: pdf_chunk_pdf_paragraph_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pdf_chunk_pdf_paragraph_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pdf_chunk_pdf_paragraph_id_seq OWNER TO postgres;

--
-- TOC entry 4378 (class 0 OID 0)
-- Dependencies: 236
-- Name: pdf_chunk_pdf_paragraph_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pdf_chunk_pdf_paragraph_id_seq OWNED BY public.pdf_chunk_pdf_paragraph.id;


--
-- TOC entry 237 (class 1259 OID 16924)
-- Name: pdf_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pdf_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pdf_id_seq OWNER TO postgres;

--
-- TOC entry 4379 (class 0 OID 0)
-- Dependencies: 237
-- Name: pdf_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pdf_id_seq OWNED BY public.pdf.id;


--
-- TOC entry 238 (class 1259 OID 16925)
-- Name: pdf_image; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pdf_image (
    id integer NOT NULL,
    pdf_page_id integer,
    gcs_bucket character varying(100),
    alt text,
    sequence integer,
    last_modified timestamp without time zone
);


ALTER TABLE public.pdf_image OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 16930)
-- Name: pdf_image_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pdf_image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pdf_image_id_seq OWNER TO postgres;

--
-- TOC entry 4380 (class 0 OID 0)
-- Dependencies: 239
-- Name: pdf_image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pdf_image_id_seq OWNED BY public.pdf_image.id;


--
-- TOC entry 240 (class 1259 OID 16931)
-- Name: pdf_page; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pdf_page (
    id integer NOT NULL,
    page_number integer,
    pdf_id integer
);


ALTER TABLE public.pdf_page OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 16934)
-- Name: pdf_page_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pdf_page_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pdf_page_id_seq OWNER TO postgres;

--
-- TOC entry 4381 (class 0 OID 0)
-- Dependencies: 241
-- Name: pdf_page_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pdf_page_id_seq OWNED BY public.pdf_page.id;


--
-- TOC entry 242 (class 1259 OID 16935)
-- Name: pdf_paragraph; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pdf_paragraph (
    id integer NOT NULL,
    context text,
    pdf_page_id integer,
    last_modified timestamp without time zone
);


ALTER TABLE public.pdf_paragraph OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 16940)
-- Name: pdf_paragraph_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pdf_paragraph_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pdf_paragraph_id_seq OWNER TO postgres;

--
-- TOC entry 4382 (class 0 OID 0)
-- Dependencies: 243
-- Name: pdf_paragraph_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pdf_paragraph_id_seq OWNED BY public.pdf_paragraph.id;


--
-- TOC entry 252 (class 1259 OID 17130)
-- Name: request_response_pair; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.request_response_pair (
    id integer NOT NULL,
    request text,
    response text,
    conversation_id text,
    created_time timestamp without time zone
);


ALTER TABLE public.request_response_pair OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 17129)
-- Name: request_response_pair_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.request_response_pair_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.request_response_pair_id_seq OWNER TO postgres;

--
-- TOC entry 4383 (class 0 OID 0)
-- Dependencies: 251
-- Name: request_response_pair_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.request_response_pair_id_seq OWNED BY public.request_response_pair.id;


--
-- TOC entry 254 (class 1259 OID 17145)
-- Name: request_response_pair_pdf_image; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.request_response_pair_pdf_image (
    request_response_pair_id integer NOT NULL,
    pdf_image_id integer NOT NULL
);


ALTER TABLE public.request_response_pair_pdf_image OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 16941)
-- Name: role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role (
    id integer NOT NULL,
    label character varying(50)
);


ALTER TABLE public.role OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 16944)
-- Name: role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_id_seq OWNER TO postgres;

--
-- TOC entry 4384 (class 0 OID 0)
-- Dependencies: 245
-- Name: role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_id_seq OWNED BY public.role.id;


--
-- TOC entry 246 (class 1259 OID 16945)
-- Name: temp_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.temp_user (
    email character varying(200),
    password character(60),
    otp character(60),
    otp_generated_time timestamp without time zone
);


ALTER TABLE public.temp_user OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 16948)
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    id integer NOT NULL,
    email character varying(200),
    password character(60),
    otp character(60),
    otp_generated_time timestamp without time zone
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 16951)
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_id_seq OWNER TO postgres;

--
-- TOC entry 4385 (class 0 OID 0)
-- Dependencies: 248
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- TOC entry 4127 (class 2604 OID 16952)
-- Name: account id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account ALTER COLUMN id SET DEFAULT nextval('public.account_id_seq'::regclass);


--
-- TOC entry 4128 (class 2604 OID 16953)
-- Name: admin id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin ALTER COLUMN id SET DEFAULT nextval('public.admin_id_seq'::regclass);


--
-- TOC entry 4143 (class 2604 OID 17179)
-- Name: ai_agent_resources id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_agent_resources ALTER COLUMN id SET DEFAULT nextval('public.ai_agent_resources_id_seq'::regclass);


--
-- TOC entry 4129 (class 2604 OID 16954)
-- Name: brand id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand ALTER COLUMN id SET DEFAULT nextval('public.brand_id_seq'::regclass);


--
-- TOC entry 4130 (class 2604 OID 16955)
-- Name: device id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device ALTER COLUMN id SET DEFAULT nextval('public.device_id_seq'::regclass);


--
-- TOC entry 4131 (class 2604 OID 16956)
-- Name: device_type id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_type ALTER COLUMN id SET DEFAULT nextval('public.device_type_id_seq'::regclass);


--
-- TOC entry 4132 (class 2604 OID 16957)
-- Name: google_user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.google_user ALTER COLUMN id SET DEFAULT nextval('public.google_user_id_seq'::regclass);


--
-- TOC entry 4133 (class 2604 OID 16958)
-- Name: pdf id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf ALTER COLUMN id SET DEFAULT nextval('public.pdf_id_seq'::regclass);


--
-- TOC entry 4134 (class 2604 OID 16959)
-- Name: pdf_chunk id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_chunk ALTER COLUMN id SET DEFAULT nextval('public.pdf_chunk_id_seq'::regclass);


--
-- TOC entry 4135 (class 2604 OID 16960)
-- Name: pdf_chunk_pdf_image id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_chunk_pdf_image ALTER COLUMN id SET DEFAULT nextval('public.pdf_chunk_pdf_image_id_seq'::regclass);


--
-- TOC entry 4136 (class 2604 OID 16961)
-- Name: pdf_chunk_pdf_paragraph id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_chunk_pdf_paragraph ALTER COLUMN id SET DEFAULT nextval('public.pdf_chunk_pdf_paragraph_id_seq'::regclass);


--
-- TOC entry 4137 (class 2604 OID 16963)
-- Name: pdf_image id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_image ALTER COLUMN id SET DEFAULT nextval('public.pdf_image_id_seq'::regclass);


--
-- TOC entry 4138 (class 2604 OID 16964)
-- Name: pdf_page id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_page ALTER COLUMN id SET DEFAULT nextval('public.pdf_page_id_seq'::regclass);


--
-- TOC entry 4139 (class 2604 OID 16965)
-- Name: pdf_paragraph id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_paragraph ALTER COLUMN id SET DEFAULT nextval('public.pdf_paragraph_id_seq'::regclass);


--
-- TOC entry 4142 (class 2604 OID 17133)
-- Name: request_response_pair id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_response_pair ALTER COLUMN id SET DEFAULT nextval('public.request_response_pair_id_seq'::regclass);


--
-- TOC entry 4140 (class 2604 OID 16966)
-- Name: role id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role ALTER COLUMN id SET DEFAULT nextval('public.role_id_seq'::regclass);


--
-- TOC entry 4141 (class 2604 OID 16967)
-- Name: user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- TOC entry 4145 (class 2606 OID 17018)
-- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- TOC entry 4147 (class 2606 OID 17020)
-- Name: account account_unique_username; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_unique_username UNIQUE (username);


--
-- TOC entry 4149 (class 2606 OID 17022)
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (id);


--
-- TOC entry 4192 (class 2606 OID 17181)
-- Name: ai_agent_resources ai_agent_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_agent_resources
    ADD CONSTRAINT ai_agent_resources_pkey PRIMARY KEY (id);


--
-- TOC entry 4151 (class 2606 OID 17024)
-- Name: brand brand_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand
    ADD CONSTRAINT brand_pkey PRIMARY KEY (id);


--
-- TOC entry 4184 (class 2606 OID 17191)
-- Name: conversation conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT conversation_pkey PRIMARY KEY (id);


--
-- TOC entry 4194 (class 2606 OID 17309)
-- Name: device_conversation device_conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_conversation
    ADD CONSTRAINT device_conversation_pkey PRIMARY KEY (device_id, conversation_id);


--
-- TOC entry 4153 (class 2606 OID 17026)
-- Name: device device_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device
    ADD CONSTRAINT device_pkey PRIMARY KEY (id);


--
-- TOC entry 4157 (class 2606 OID 17028)
-- Name: device_type device_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_type
    ADD CONSTRAINT device_type_pkey PRIMARY KEY (id);


--
-- TOC entry 4155 (class 2606 OID 17030)
-- Name: device device_unique_label; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device
    ADD CONSTRAINT device_unique_label UNIQUE (label);


--
-- TOC entry 4159 (class 2606 OID 17032)
-- Name: google_user google_user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.google_user
    ADD CONSTRAINT google_user_pkey PRIMARY KEY (id);


--
-- TOC entry 4188 (class 2606 OID 17144)
-- Name: note note_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.note
    ADD CONSTRAINT note_pkey PRIMARY KEY (id);


--
-- TOC entry 4166 (class 2606 OID 17034)
-- Name: pdf_chunk_pdf_image pdf_chunk_pdf_image_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_chunk_pdf_image
    ADD CONSTRAINT pdf_chunk_pdf_image_pkey PRIMARY KEY (id);


--
-- TOC entry 4168 (class 2606 OID 17036)
-- Name: pdf_chunk_pdf_paragraph pdf_chunk_pdf_paragraph_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_chunk_pdf_paragraph
    ADD CONSTRAINT pdf_chunk_pdf_paragraph_pkey PRIMARY KEY (id);


--
-- TOC entry 4163 (class 2606 OID 17038)
-- Name: pdf_chunk pdf_chunk_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_chunk
    ADD CONSTRAINT pdf_chunk_pkey PRIMARY KEY (id);


--
-- TOC entry 4170 (class 2606 OID 17040)
-- Name: pdf_image pdf_image_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_image
    ADD CONSTRAINT pdf_image_pkey PRIMARY KEY (id);


--
-- TOC entry 4172 (class 2606 OID 17042)
-- Name: pdf_page pdf_page_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_page
    ADD CONSTRAINT pdf_page_pkey PRIMARY KEY (id);


--
-- TOC entry 4174 (class 2606 OID 17044)
-- Name: pdf_paragraph pdf_paragraph_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_paragraph
    ADD CONSTRAINT pdf_paragraph_pkey PRIMARY KEY (id);


--
-- TOC entry 4161 (class 2606 OID 17046)
-- Name: pdf pdf_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf
    ADD CONSTRAINT pdf_pkey PRIMARY KEY (id);


--
-- TOC entry 4190 (class 2606 OID 17149)
-- Name: request_response_pair_pdf_image request_response_pair_pdf_image_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_response_pair_pdf_image
    ADD CONSTRAINT request_response_pair_pdf_image_pkey PRIMARY KEY (request_response_pair_id, pdf_image_id);


--
-- TOC entry 4186 (class 2606 OID 17137)
-- Name: request_response_pair request_response_pair_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_response_pair
    ADD CONSTRAINT request_response_pair_pkey PRIMARY KEY (id);


--
-- TOC entry 4176 (class 2606 OID 17048)
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);


--
-- TOC entry 4178 (class 2606 OID 17050)
-- Name: temp_user temp_user_unique_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.temp_user
    ADD CONSTRAINT temp_user_unique_email UNIQUE (email);


--
-- TOC entry 4180 (class 2606 OID 17052)
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- TOC entry 4182 (class 2606 OID 17054)
-- Name: user user_unique_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_unique_email UNIQUE (email);


--
-- TOC entry 4164 (class 1259 OID 17055)
-- Name: fki_o; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_o ON public.pdf_chunk_pdf_image USING btree (pdf_image_id);


--
-- TOC entry 4196 (class 2606 OID 17056)
-- Name: admin account_admin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT account_admin FOREIGN KEY (id) REFERENCES public.account(id);


--
-- TOC entry 4199 (class 2606 OID 17061)
-- Name: google_user account_google_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.google_user
    ADD CONSTRAINT account_google_user FOREIGN KEY (id) REFERENCES public.account(id);


--
-- TOC entry 4208 (class 2606 OID 17066)
-- Name: user account_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT account_user FOREIGN KEY (id) REFERENCES public.account(id);


--
-- TOC entry 4197 (class 2606 OID 17071)
-- Name: device brand_device; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device
    ADD CONSTRAINT brand_device FOREIGN KEY (brand_id) REFERENCES public.brand(id);


--
-- TOC entry 4209 (class 2606 OID 17150)
-- Name: conversation conversation_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT conversation_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.account(id) ON DELETE CASCADE NOT VALID;


--
-- TOC entry 4214 (class 2606 OID 17303)
-- Name: device_conversation conversation_device_conversation; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_conversation
    ADD CONSTRAINT conversation_device_conversation FOREIGN KEY (conversation_id) REFERENCES public.conversation(id) NOT VALID;


--
-- TOC entry 4198 (class 2606 OID 17076)
-- Name: device device_type_device; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device
    ADD CONSTRAINT device_type_device FOREIGN KEY (device_type_id) REFERENCES public.device_type(id);


--
-- TOC entry 4200 (class 2606 OID 17335)
-- Name: pdf fk_device_existing; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf
    ADD CONSTRAINT fk_device_existing FOREIGN KEY (device_id) REFERENCES public.device(id) ON DELETE CASCADE;


--
-- TOC entry 4215 (class 2606 OID 17340)
-- Name: device_conversation fk_device_existing; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_conversation
    ADD CONSTRAINT fk_device_existing FOREIGN KEY (device_id) REFERENCES public.device(id) ON DELETE CASCADE;


--
-- TOC entry 4206 (class 2606 OID 17345)
-- Name: pdf_page fk_pdf_existing; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_page
    ADD CONSTRAINT fk_pdf_existing FOREIGN KEY (pdf_id) REFERENCES public.pdf(id) ON DELETE CASCADE;


--
-- TOC entry 4205 (class 2606 OID 17350)
-- Name: pdf_image fk_pdf_page_existing; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_image
    ADD CONSTRAINT fk_pdf_page_existing FOREIGN KEY (pdf_page_id) REFERENCES public.pdf_page(id) ON DELETE CASCADE;


--
-- TOC entry 4207 (class 2606 OID 17355)
-- Name: pdf_paragraph fk_pdf_page_existing; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_paragraph
    ADD CONSTRAINT fk_pdf_page_existing FOREIGN KEY (pdf_page_id) REFERENCES public.pdf_page(id) ON DELETE CASCADE;


--
-- TOC entry 4203 (class 2606 OID 17360)
-- Name: pdf_chunk_pdf_paragraph fk_pdf_paragraph_existing; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_chunk_pdf_paragraph
    ADD CONSTRAINT fk_pdf_paragraph_existing FOREIGN KEY (pdf_paragraph_id) REFERENCES public.pdf_paragraph(id) ON DELETE CASCADE;


--
-- TOC entry 4211 (class 2606 OID 17160)
-- Name: note note_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.note
    ADD CONSTRAINT note_id_fkey FOREIGN KEY (id) REFERENCES public.request_response_pair(id) ON DELETE CASCADE NOT VALID;


--
-- TOC entry 4201 (class 2606 OID 17081)
-- Name: pdf_chunk_pdf_image pdf_chunk_pdf_chunk_pdf_image_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_chunk_pdf_image
    ADD CONSTRAINT pdf_chunk_pdf_chunk_pdf_image_fkey FOREIGN KEY (pdf_chunk_id) REFERENCES public.pdf_chunk(id) ON DELETE CASCADE;


--
-- TOC entry 4204 (class 2606 OID 17086)
-- Name: pdf_chunk_pdf_paragraph pdf_chunk_pdf_chunk_pdf_paragraph_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_chunk_pdf_paragraph
    ADD CONSTRAINT pdf_chunk_pdf_chunk_pdf_paragraph_fkey FOREIGN KEY (pdf_chunk_id) REFERENCES public.pdf_chunk(id) ON DELETE CASCADE;


--
-- TOC entry 4202 (class 2606 OID 17091)
-- Name: pdf_chunk_pdf_image pdf_image_pdf_chunk_pdf_image_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_chunk_pdf_image
    ADD CONSTRAINT pdf_image_pdf_chunk_pdf_image_fkey FOREIGN KEY (pdf_image_id) REFERENCES public.pdf_image(id) ON DELETE CASCADE NOT VALID;


--
-- TOC entry 4210 (class 2606 OID 17200)
-- Name: request_response_pair request_response_pair_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_response_pair
    ADD CONSTRAINT request_response_pair_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversation(id) ON DELETE CASCADE;


--
-- TOC entry 4212 (class 2606 OID 17170)
-- Name: request_response_pair_pdf_image request_response_pair_pdf_image_pdf_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_response_pair_pdf_image
    ADD CONSTRAINT request_response_pair_pdf_image_pdf_image_id_fkey FOREIGN KEY (pdf_image_id) REFERENCES public.pdf_image(id) ON DELETE CASCADE NOT VALID;


--
-- TOC entry 4213 (class 2606 OID 17165)
-- Name: request_response_pair_pdf_image request_response_pair_pdf_image_request_response_pair_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_response_pair_pdf_image
    ADD CONSTRAINT request_response_pair_pdf_image_request_response_pair_id_fkey FOREIGN KEY (request_response_pair_id) REFERENCES public.request_response_pair(id) ON DELETE CASCADE NOT VALID;


--
-- TOC entry 4195 (class 2606 OID 17116)
-- Name: account role_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT role_account FOREIGN KEY (role_id) REFERENCES public.role(id);


--
-- TOC entry 4366 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO cloudsqlsuperuser;


-- Completed on 2025-07-20 20:11:31

--
-- PostgreSQL database dump complete
--

-- Insert roles
INSERT INTO public.role (label) VALUES ('user');
INSERT INTO public.role (label) VALUES ('admin');

-- Insert into account
INSERT INTO public.account (username, role_id, display_name)
VALUES ('admin_01', (SELECT id FROM public.role WHERE label = 'admin'), 'admin_01');

-- Insert into admin (link to account)
INSERT INTO public.admin (id, password)
SELECT id, '$2a$10$e2lPnu8i/V86/n9YfbfcxOPhwmCZI.aU32fJHxnnhsrGkdUvDuC9i'
FROM public.account
WHERE username = 'admin_01';