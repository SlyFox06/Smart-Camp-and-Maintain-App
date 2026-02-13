-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "department" VARCHAR(100),
    "avatar" TEXT,
    "phone" VARCHAR(20),
    "is_first_login" BOOLEAN DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "reset_password_token" TEXT,
    "reset_password_expires" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "access_scope" TEXT DEFAULT 'college',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) DEFAULT 'operational',
    "building" VARCHAR(100) NOT NULL,
    "floor" VARCHAR(50) NOT NULL,
    "room" VARCHAR(50) NOT NULL,
    "department" VARCHAR(100) NOT NULL,
    "qr_url" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "status" VARCHAR(50) DEFAULT 'reported',
    "severity" VARCHAR(50) DEFAULT 'medium',
    "scope" VARCHAR(20) DEFAULT 'college',
    "category" VARCHAR(50),
    "images" TEXT,
    "video" TEXT,
    "work_proof" TEXT,
    "work_note" TEXT,
    "admin_comment" TEXT,
    "feedback" TEXT,
    "rating" INTEGER,
    "otp" VARCHAR(10),
    "otp_verified" BOOLEAN DEFAULT false,
    "rejection_reason" TEXT,
    "student_id" UUID NOT NULL,
    "technician_id" UUID,
    "asset_id" UUID,
    "room_id" UUID,
    "assigned_at" TIMESTAMPTZ(6),
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "room_number" VARCHAR(50) NOT NULL,
    "block" VARCHAR(100) NOT NULL,
    "floor" VARCHAR(50) NOT NULL,
    "hostel_name" VARCHAR(100) NOT NULL,
    "capacity" INTEGER,
    "status" VARCHAR(50) DEFAULT 'operational',
    "qr_url" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technicians" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "skill_type" VARCHAR(100) NOT NULL,
    "assigned_area" VARCHAR(100),
    "is_available" BOOLEAN DEFAULT true,
    "temporary_password" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technicians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_history" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "complaint_id" UUID NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "message" TEXT,
    "timestamp" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "is_read" BOOLEAN DEFAULT false,
    "related_complaint_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "details" TEXT,
    "timestamp" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_assets_status" ON "assets"("status");

-- CreateIndex
CREATE INDEX "idx_complaints_asset" ON "complaints"("asset_id");

-- CreateIndex
CREATE INDEX "idx_complaints_room" ON "complaints"("room_id");

-- CreateIndex
CREATE INDEX "idx_complaints_status" ON "complaints"("status");

-- CreateIndex
CREATE INDEX "idx_complaints_student" ON "complaints"("student_id");

-- CreateIndex
CREATE INDEX "idx_complaints_technician" ON "complaints"("technician_id");

-- CreateIndex
CREATE INDEX "idx_rooms_status" ON "rooms"("status");

-- CreateIndex
CREATE INDEX "idx_rooms_hostel" ON "rooms"("hostel_name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_room" ON "rooms"("block", "floor", "room_number");

-- CreateIndex
CREATE UNIQUE INDEX "technicians_user_id_key" ON "technicians"("user_id");

-- CreateIndex
CREATE INDEX "idx_status_history_complaint" ON "status_history"("complaint_id");

-- CreateIndex
CREATE INDEX "idx_notifications_unread" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "idx_notifications_user" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_user" ON "audit_logs"("user_id");

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_complaint_id_fkey" FOREIGN KEY ("related_complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
