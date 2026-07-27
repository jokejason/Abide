import { pgTable, serial, timestamp, index, unique, varchar, integer, numeric, text, jsonb, foreignKey, smallint, uuid, uniqueIndex } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const gyms = pgTable("gyms", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	gymId: varchar("gym_id", { length: 36 }).notNull(),
	name: varchar({ length: 128 }).notNull(),
	address: varchar({ length: 512 }),
	contact: varchar({ length: 32 }),
	businessHours: varchar("business_hours", { length: 64 }),
	status: integer().default(1).notNull(),
	commissionRate: numeric("commission_rate", { precision: 5, scale:  2 }).default('0'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("gyms_gym_id_idx").using("btree", table.gymId.asc().nullsLast().op("text_ops")),
	index("gyms_status_idx").using("btree", table.status.asc().nullsLast().op("int4_ops")),
	unique("gyms_gym_id_unique").on(table.gymId),
]);

export const dishes = pgTable("dishes", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	name: varchar({ length: 128 }).notNull(),
	category: varchar({ length: 32 }).notNull(),
	price: integer().notNull(),
	image: varchar({ length: 512 }),
	description: text(),
	nutrition: jsonb(),
	status: integer().default(1).notNull(),
	stock: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("dishes_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("dishes_status_idx").using("btree", table.status.asc().nullsLast().op("int4_ops")),
]);

export const stores = pgTable("stores", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	name: varchar({ length: 128 }).notNull(),
	address: varchar({ length: 512 }),
	contact: varchar({ length: 32 }),
	businessHours: varchar("business_hours", { length: 64 }),
	deliveryRange: numeric("delivery_range", { precision: 5, scale:  1 }),
	status: integer().default(1).notNull(),
	managerId: varchar("manager_id", { length: 36 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("stores_manager_id_idx").using("btree", table.managerId.asc().nullsLast().op("text_ops")),
	index("stores_status_idx").using("btree", table.status.asc().nullsLast().op("int4_ops")),
]);

export const trainingRecords = pgTable("training_records", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	gymId: varchar("gym_id", { length: 36 }),
	date: varchar({ length: 10 }).notNull(),
	type: varchar({ length: 32 }).notNull(),
	exercises: jsonb(),
	cardio: jsonb(),
	caloriesBurned: numeric("calories_burned", { precision: 8, scale:  2 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("training_records_date_idx").using("btree", table.date.asc().nullsLast().op("text_ops")),
	index("training_records_gym_id_idx").using("btree", table.gymId.asc().nullsLast().op("text_ops")),
	index("training_records_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	index("training_records_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "training_records_user_id_users_id_fk"
		}),
]);

export const orders = pgTable("orders", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	orderNo: varchar("order_no", { length: 64 }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	storeId: varchar("store_id", { length: 36 }).notNull(),
	gymId: varchar("gym_id", { length: 36 }),
	items: jsonb().notNull(),
	totalAmount: integer("total_amount").notNull(),
	discountAmount: integer("discount_amount").default(0).notNull(),
	payAmount: integer("pay_amount").notNull(),
	deliveryAddress: varchar("delivery_address", { length: 512 }),
	deliveryType: varchar("delivery_type", { length: 32 }).default('immediate').notNull(),
	scheduledTime: timestamp("scheduled_time", { withTimezone: true, mode: 'string' }),
	status: varchar({ length: 32 }).default('pending').notNull(),
	paymentMethod: varchar("payment_method", { length: 32 }),
	remark: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("orders_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("orders_gym_id_idx").using("btree", table.gymId.asc().nullsLast().op("text_ops")),
	index("orders_order_no_idx").using("btree", table.orderNo.asc().nullsLast().op("text_ops")),
	index("orders_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("orders_store_id_idx").using("btree", table.storeId.asc().nullsLast().op("text_ops")),
	index("orders_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "orders_store_id_stores_id_fk"
		}),
	unique("orders_order_no_unique").on(table.orderNo),
]);

export const users = pgTable("users", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	openid: varchar({ length: 128 }).notNull(),
	nickname: varchar({ length: 64 }),
	avatar: varchar({ length: 512 }),
	phone: varchar({ length: 256 }),
	gender: integer().default(0).notNull(),
	age: integer(),
	height: numeric({ precision: 5, scale:  1 }),
	weight: numeric({ precision: 5, scale:  1 }),
	role: varchar({ length: 32 }).default('user').notNull(),
	gymId: varchar("gym_id", { length: 36 }),
	status: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	fitnessGoal: varchar("fitness_goal", { length: 20 }).default('body_shape'),
}, (table) => [
	index("users_gym_id_idx").using("btree", table.gymId.asc().nullsLast().op("text_ops")),
	index("users_openid_idx").using("btree", table.openid.asc().nullsLast().op("text_ops")),
	index("users_role_idx").using("btree", table.role.asc().nullsLast().op("text_ops")),
	index("users_status_idx").using("btree", table.status.asc().nullsLast().op("int4_ops")),
	unique("users_openid_unique").on(table.openid),
]);

// ==================== 课程表 ====================
export const courses = pgTable("courses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	coachName: varchar("coach_name", { length: 50 }).notNull(),
	coachAvatar: varchar("coach_avatar", { length: 500 }),
	category: varchar({ length: 50 }).notNull(),
	startTime: timestamp("start_time", { withTimezone: true, mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { withTimezone: true, mode: 'string' }).notNull(),
	maxCapacity: integer("max_capacity").default(20).notNull(),
	currentCount: integer("current_count").default(0).notNull(),
	price: integer().default(0).notNull(),
	image: varchar({ length: 500 }),
	status: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("courses_start_time_idx").using("btree", table.startTime.asc().nullsLast().op("timestamptz_ops")),
	index("courses_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("courses_status_idx").using("btree", table.status.asc().nullsLast().op("int4_ops")),
]);

// ==================== 课程预约表 ====================
export const courseBookings = pgTable("course_bookings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	courseId: uuid("course_id").notNull(),
	status: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("course_bookings_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("course_bookings_course_id_idx").using("btree", table.courseId.asc().nullsLast().op("uuid_ops")),
	index("course_bookings_status_idx").using("btree", table.status.asc().nullsLast().op("int4_ops")),
	unique("course_bookings_user_course_idx").on(table.userId, table.courseId),
]);
