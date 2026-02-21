import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ShoppingCart {
    total: bigint;
    createdAt: Time;
    currency: string;
    items: Array<ServerPlan>;
}
export type AssignedTo = {
    __kind__: "plan";
    plan: string;
} | {
    __kind__: "user";
    user: Principal;
};
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface DedicatedServer {
    id: string;
    status: ServerStatus;
    assignedTo?: AssignedTo;
    name: string;
    createdAt: Time;
    storageGb: bigint;
    updatedAt: Time;
    ramGb: bigint;
    cpuCores: bigint;
}
export interface Invoice {
    id: string;
    status: string;
    createdAt: Time;
    user: Principal;
    orderId: string;
    currency: string;
    amount: bigint;
}
export interface CustomServerConfig {
    bandwidthMbps: bigint;
    durationMonths: bigint;
    storageGb: bigint;
    ramGb: bigint;
    location: string;
    cpuCores: bigint;
}
export interface Order {
    id: string;
    status: string;
    createdAt: Time;
    user: Principal;
    serverPlan: ServerPlan;
    currency: string;
    price: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface UpdatePlanInput {
    cpu: string;
    ram: string;
    bandwidth: string;
    storage: string;
    name: string;
    available: boolean;
    currency: string;
    pricePerMonth: bigint;
    location: string;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export type InvitationStatus = {
    __kind__: "found";
    found: {
        sender: Principal;
    };
} | {
    __kind__: "expired";
    expired: null;
} | {
    __kind__: "used";
    used: null;
} | {
    __kind__: "notFound";
    notFound: null;
};
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface ServerPlan {
    id: string;
    cpu: string;
    ram: string;
    bandwidth: string;
    storage: string;
    name: string;
    createdAt: Time;
    available: boolean;
    currency: string;
    pricePerMonth: bigint;
    location: string;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface UserProfile {
    principal: Principal;
    name: string;
    createdAt: Time;
    email: string;
}
export interface CheckResult {
    isAnonymous: boolean;
    adminCount: bigint;
    hasAdmin: boolean;
}
export enum ServerStatus {
    assigned = "assigned",
    decommissioned = "decommissioned",
    available = "available"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCustomServerToCart(config: CustomServerConfig): Promise<ShoppingCart>;
    addServerPlan(name: string, cpu: string, ram: string, storage: string, bandwidth: string, location: string, pricePerMonth: bigint, currency: string, available: boolean): Promise<ServerPlan>;
    addToCart(planId: string): Promise<ShoppingCart>;
    allUsers(): Promise<Array<UserProfile>>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignServerToPlan(serverId: string, planId: string): Promise<DedicatedServer>;
    assignServerToUser(serverId: string, user: Principal): Promise<DedicatedServer>;
    autoAssignAdminOnLogin(): Promise<boolean>;
    checkAdminStatus(): Promise<CheckResult>;
    checkout(successUrl: string, cancelUrl: string): Promise<string>;
    clearCart(): Promise<void>;
    createAdminInvitation(): Promise<string>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createDedicatedServer(id: string, name: string, cpuCores: bigint, ramGb: bigint, storageGb: bigint): Promise<DedicatedServer>;
    deleteDedicatedServer(serverId: string): Promise<void>;
    getActiveInvitations(): Promise<Array<[string, Principal]>>;
    getAllDedicatedServers(): Promise<Array<DedicatedServer>>;
    getAllInvoices(): Promise<Array<Invoice>>;
    getAllOrders(): Promise<Array<Order>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCart(): Promise<ShoppingCart>;
    getCurrentUserProfile(): Promise<UserProfile | null>;
    getDedicatedServer(serverId: string): Promise<DedicatedServer>;
    getInvitationCodes(): Promise<Array<string>>;
    getPaymentStatus(sessionId: string): Promise<StripeSessionStatus>;
    getPlanById(planId: string): Promise<ServerPlan>;
    getServerPlans(): Promise<Array<ServerPlan>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserById(user: Principal): Promise<UserProfile | null>;
    getUserInvoices(user: Principal): Promise<Array<Invoice>>;
    getUserOrders(user: Principal): Promise<Array<Order>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasAdmin(): Promise<boolean>;
    isAdminSetUp(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isInvitationCodeValid(_code: string): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    promoteToAdminIfNeeded(): Promise<void>;
    redeemAdminInvitation(code: string): Promise<boolean>;
    registerUser(name: string, email: string): Promise<UserProfile>;
    removeFromCart(planId: string): Promise<ShoppingCart>;
    removeServerPlan(planId: string): Promise<void>;
    resetAdminState(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    seedDefaultPlans(): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateServerPlan(planId: string, update: UpdatePlanInput): Promise<ServerPlan>;
    verifyInvitationCode(code: string): Promise<InvitationStatus>;
}
