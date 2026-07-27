import { relations } from "drizzle-orm/relations";
import { users, trainingRecords, orders, stores } from "./schema";

export const trainingRecordsRelations = relations(trainingRecords, ({one}) => ({
	user: one(users, {
		fields: [trainingRecords.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	trainingRecords: many(trainingRecords),
	orders: many(orders),
}));

export const ordersRelations = relations(orders, ({one}) => ({
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	store: one(stores, {
		fields: [orders.storeId],
		references: [stores.id]
	}),
}));

export const storesRelations = relations(stores, ({many}) => ({
	orders: many(orders),
}));