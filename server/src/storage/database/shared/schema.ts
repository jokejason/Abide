import { sql } from "drizzle-orm"
import { pgTable, varchar, integer, numeric, timestamp, jsonb, index, text, serial } from "drizzle-orm/pg-core"
import { createSchemaFactory } from "drizzle-zod"

export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// ==================== 用户表 ====================
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    openid: varchar("openid", { length: 128 }).notNull().unique(),
    nickname: varchar("nickname", { length: 64 }),
    avatar: varchar("avatar", { length: 512 }),
    phone: varchar("phone", { length: 256 }),
    gender: integer("gender").default(0).notNull(),
    age: integer("age"),
    height: numeric("height", { precision: 5, scale: 1 }),
    weight: numeric("weight", { precision: 5, scale: 1 }),
    role: varchar("role", { length: 32 }).default("user").notNull(),
    gym_id: varchar("gym_id", { length: 36 }),
    fitness_goal: varchar("fitness_goal", { length: 20 }).default("body_shape"),
    status: integer("status").default(1).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("users_openid_idx").on(table.openid),
    index("users_gym_id_idx").on(table.gym_id),
    index("users_role_idx").on(table.role),
    index("users_status_idx").on(table.status),
  ]
)

// ==================== 健身房表 ====================
export const gyms = pgTable(
  "gyms",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    gym_id: varchar("gym_id", { length: 36 }).notNull().unique(),
    name: varchar("name", { length: 128 }).notNull(),
    address: varchar("address", { length: 512 }),
    contact: varchar("contact", { length: 32 }),
    business_hours: varchar("business_hours", { length: 64 }),
    status: integer("status").default(1).notNull(),
    commission_rate: numeric("commission_rate", { precision: 5, scale: 2 }).default("0"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("gyms_gym_id_idx").on(table.gym_id),
    index("gyms_status_idx").on(table.status),
  ]
)

// ==================== 门店表 ====================
export const stores = pgTable(
  "stores",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 128 }).notNull(),
    address: varchar("address", { length: 512 }),
    contact: varchar("contact", { length: 32 }),
    business_hours: varchar("business_hours", { length: 64 }),
    delivery_range: numeric("delivery_range", { precision: 5, scale: 1 }),
    status: integer("status").default(1).notNull(),
    manager_id: varchar("manager_id", { length: 36 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("stores_status_idx").on(table.status),
    index("stores_manager_id_idx").on(table.manager_id),
  ]
)

// ==================== 菜品表 ====================
export const dishes = pgTable(
  "dishes",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 128 }).notNull(),
    category: varchar("category", { length: 32 }).notNull(),
    price: integer("price").notNull(),
    image: varchar("image", { length: 512 }),
    description: text("description"),
    nutrition: jsonb("nutrition"),
    status: integer("status").default(1).notNull(),
    stock: integer("stock").default(0).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("dishes_category_idx").on(table.category),
    index("dishes_status_idx").on(table.status),
  ]
)

// ==================== 训练记录表 ====================
export const trainingRecords = pgTable(
  "training_records",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
    gym_id: varchar("gym_id", { length: 36 }),
    date: varchar("date", { length: 10 }).notNull(),
    type: varchar("type", { length: 32 }).notNull(),
    exercises: jsonb("exercises"),
    cardio: jsonb("cardio"),
    calories_burned: numeric("calories_burned", { precision: 8, scale: 2 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("training_records_user_id_idx").on(table.user_id),
    index("training_records_gym_id_idx").on(table.gym_id),
    index("training_records_date_idx").on(table.date),
    index("training_records_type_idx").on(table.type),
  ]
)

// ==================== 订单表 ====================
export const orders = pgTable(
  "orders",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    order_no: varchar("order_no", { length: 64 }).notNull().unique(),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
    store_id: varchar("store_id", { length: 36 }).notNull().references(() => stores.id),
    gym_id: varchar("gym_id", { length: 36 }),
    items: jsonb("items").notNull(),
    total_amount: integer("total_amount").notNull(),
    discount_amount: integer("discount_amount").default(0).notNull(),
    pay_amount: integer("pay_amount").notNull(),
    delivery_address: varchar("delivery_address", { length: 512 }),
    delivery_type: varchar("delivery_type", { length: 32 }).default("immediate").notNull(),
    scheduled_time: timestamp("scheduled_time", { withTimezone: true }),
    status: varchar("status", { length: 32 }).default("pending").notNull(),
    payment_method: varchar("payment_method", { length: 32 }),
    remark: text("remark"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("orders_order_no_idx").on(table.order_no),
    index("orders_user_id_idx").on(table.user_id),
    index("orders_store_id_idx").on(table.store_id),
    index("orders_gym_id_idx").on(table.gym_id),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.created_at),
  ]
)

// ==================== Zod Schema ====================
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({ coerce: { date: true } })

export const insertUserSchema = createCoercedInsertSchema(users).pick({
  openid: true,
  nickname: true,
  avatar: true,
  phone: true,
  gender: true,
  age: true,
  height: true,
  weight: true,
  role: true,
  gym_id: true,
})

export const insertGymSchema = createCoercedInsertSchema(gyms).pick({
  gym_id: true,
  name: true,
  address: true,
  contact: true,
  business_hours: true,
  commission_rate: true,
})

export const insertStoreSchema = createCoercedInsertSchema(stores).pick({
  name: true,
  address: true,
  contact: true,
  business_hours: true,
  delivery_range: true,
  manager_id: true,
})

export const insertDishSchema = createCoercedInsertSchema(dishes).pick({
  name: true,
  category: true,
  price: true,
  image: true,
  description: true,
  nutrition: true,
  stock: true,
})

export const insertTrainingRecordSchema = createCoercedInsertSchema(trainingRecords).pick({
  user_id: true,
  gym_id: true,
  date: true,
  type: true,
  exercises: true,
  cardio: true,
  calories_burned: true,
})

export const insertOrderSchema = createCoercedInsertSchema(orders).pick({
  order_no: true,
  user_id: true,
  store_id: true,
  gym_id: true,
  items: true,
  total_amount: true,
  discount_amount: true,
  pay_amount: true,
  delivery_address: true,
  delivery_type: true,
  scheduled_time: true,
  status: true,
  payment_method: true,
  remark: true,
})

// ==================== Types ====================
export type User = typeof users.$inferSelect
export type Gym = typeof gyms.$inferSelect
export type Store = typeof stores.$inferSelect
export type Dish = typeof dishes.$inferSelect
export type TrainingRecord = typeof trainingRecords.$inferSelect
export type Order = typeof orders.$inferSelect
