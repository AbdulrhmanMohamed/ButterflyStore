"use server";

import * as db from "./db";

export async function getCatalog() {
  return {
    companies: db.companies.list(),
    categories: db.categories.list(),
    products: db.products.list(10000),
    variants: db.variants.list(10000),
  };
}

export async function companiesList() {
  return db.companies.list();
}
export async function companyCreate(data: any) {
  return db.companies.create(data);
}
export async function companyUpdate(id: string, data: any) {
  return db.companies.update(id, data);
}
export async function companyDelete(id: string) {
  return db.companies.delete(id);
}

export async function categoriesList() {
  return db.categories.list();
}
export async function categoryCreate(data: any) {
  return db.categories.create(data);
}
export async function categoryUpdate(id: string, data: any) {
  return db.categories.update(id, data);
}
export async function categoryDelete(id: string) {
  return db.categories.delete(id);
}

export async function productsList() {
  return db.products.list(10000);
}
export async function productCreate(data: any) {
  return db.products.create(data);
}
export async function productUpdate(id: string, data: any) {
  return db.products.update(id, data);
}
export async function productDelete(id: string) {
  return db.products.delete(id);
}

export async function variantCreate(data: any) {
  return db.variants.create(data);
}
export async function variantDelete(id: string) {
  return db.variants.delete(id);
}

export async function usersList() {
  return db.users.list();
}
export async function userByPhone(phone: string) {
  return db.users.byPhone(phone);
}
export async function userCreate(data: any) {
  return db.users.create(data);
}
export async function userUpdate(id: string, data: any) {
  return db.users.update(id, data);
}

export async function ordersList(limit = 500) {
  return db.orders.list(limit);
}
export async function orderCreate(data: any) {
  return db.orders.create(data);
}
export async function orderUpdate(id: string, data: any) {
  return db.orders.update(id, data);
}

export async function customersList(limit = 500) {
  return db.customers.list(limit);
}
export async function customerCreate(data: any) {
  return db.customers.create(data);
}
export async function customerDelete(id: string) {
  return db.customers.delete(id);
}

export async function discountsList() {
  return db.discountCodes.list();
}
export async function discountCreate(data: any) {
  return db.discountCodes.create(data);
}
export async function discountUpdate(id: string, data: any) {
  return db.discountCodes.update(id, data);
}
export async function discountDelete(id: string) {
  return db.discountCodes.delete(id);
}

export async function paymentsList() {
  return db.paymentMethods.list();
}
export async function paymentCreate(data: any) {
  return db.paymentMethods.create(data);
}
export async function paymentUpdate(id: string, data: any) {
  return db.paymentMethods.update(id, data);
}
export async function paymentDelete(id: string) {
  return db.paymentMethods.delete(id);
}
