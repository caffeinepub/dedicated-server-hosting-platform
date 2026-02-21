import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import Iter "mo:core/Iter";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Include authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Custom types
  public type ServerPlan = {
    id : Text;
    name : Text;
    cpu : Text;
    ram : Text;
    storage : Text;
    bandwidth : Text;
    location : Text;
    pricePerMonth : Nat;
    currency : Text;
    available : Bool;
    createdAt : Time.Time;
  };

  public type UserProfile = {
    principal : Principal;
    name : Text;
    email : Text;
    createdAt : Time.Time;
  };

  public type Order = {
    id : Text;
    user : Principal;
    serverPlan : ServerPlan;
    price : Nat;
    currency : Text;
    status : Text;
    createdAt : Time.Time;
  };

  public type Invoice = {
    id : Text;
    orderId : Text;
    user : Principal;
    amount : Nat;
    currency : Text;
    status : Text;
    createdAt : Time.Time;
  };

  public type ShoppingCart = {
    items : [ServerPlan];
    total : Nat;
    currency : Text;
    createdAt : Time.Time;
  };

  public type UpdatePlanInput = {
    name : Text;
    cpu : Text;
    ram : Text;
    storage : Text;
    bandwidth : Text;
    location : Text;
    pricePerMonth : Nat;
    currency : Text;
    available : Bool;
  };

  public type CustomServerConfig = {
    cpuCores : Nat;
    ramGb : Nat;
    storageGb : Nat;
    bandwidthMbps : Nat;
    location : Text;
    durationMonths : Nat;
  };

  public type DedicatedServer = {
    id : Text;
    name : Text;
    cpuCores : Nat;
    ramGb : Nat;
    storageGb : Nat;
    status : ServerStatus;
    assignedTo : ?AssignedTo;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  public type ServerStatus = {
    #available;
    #assigned;
    #decommissioned;
  };

  public type AssignedTo = {
    #user : Principal;
    #plan : Text; // planId
  };

  public type CheckResult = {
    hasAdmin : Bool;
    adminCount : Nat;
    isAnonymous : Bool;
  };

  // Storage
  let serverPlans = Map.empty<Text, ServerPlan>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let orders = Map.empty<Text, Order>();
  let invoices = Map.empty<Text, Invoice>();
  let activeCarts = Map.empty<Principal, ShoppingCart>();
  let checkoutSessions = Map.empty<Text, Principal>();
  let adminInvitations = Map.empty<Text, Principal>();
  let dedicatedServers = Map.empty<Text, DedicatedServer>();

  // Pricing constants for custom servers
  let customServerPricing = {
    baseCpuPrice : Nat = 500;
    baseRamPrice : Nat = 250;
    baseStoragePrice : Nat = 100;
    baseBandwidthPrice : Nat = 50;
    priceMultiplier : Nat = 1000;
  };

  // Stripe integration
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  // Helper functions
  func generateId(prefix : Text) : Text {
    let timestamp = Time.now().toText();
    prefix # "_" # timestamp;
  };

  func getCurrentCart(caller : Principal) : ShoppingCart {
    switch (activeCarts.get(caller)) {
      case (null) {
        {
          items = [];
          total = 0;
          currency = "usd";
          createdAt = Time.now();
        };
      };
      case (?cart) { cart };
    };
  };

  // Custom Server Plan Calculation
  func calculateCustomServerPrice(config : CustomServerConfig) : Nat {
    let cpuCost = config.cpuCores * customServerPricing.baseCpuPrice;
    let ramCost = config.ramGb * customServerPricing.baseRamPrice;
    let storageCost = config.storageGb * customServerPricing.baseStoragePrice;
    let bandwidthCost = (config.bandwidthMbps / 10) * customServerPricing.baseBandwidthPrice;

    let monthlyCost = cpuCost + ramCost + storageCost + bandwidthCost;
    let totalCost = monthlyCost * config.durationMonths;
    (totalCost * customServerPricing.priceMultiplier) / 1000;
  };

  func generateDefaultPlan(name : Text, cpu : Text, ram : Text, storage : Text, bandwidth : Text, pricePerMonth : Nat) : ServerPlan {
    {
      id = generateId("plan");
      name;
      cpu;
      ram;
      storage;
      bandwidth;
      location = "";
      pricePerMonth;
      currency = "usd";
      available = true;
      createdAt = Time.now();
    };
  };

  // Seed Default Plans - Admin only to prevent unauthorized manipulation
  public shared ({ caller }) func seedDefaultPlans() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can seed default plans");
    };

    switch (serverPlans.get("Basic")) {
      case (null) {
        let basicPlan = {
          id = "Basic";
          name = "Basic";
          cpu = "2 cores";
          ram = "4GB";
          storage = "100GB";
          bandwidth = "1TB";
          location = "data center";
          pricePerMonth = 1000;
          currency = "usd";
          available = true;
          createdAt = Time.now();
        };
        serverPlans.add("Basic", basicPlan);
      };
      case (?_) {};
    };

    switch (serverPlans.get("Standard")) {
      case (null) {
        let standardPlan = {
          id = "Standard";
          name = "Standard";
          cpu = "4 cores";
          ram = "8GB";
          storage = "250GB";
          bandwidth = "2TB";
          location = "data center";
          pricePerMonth = 2000;
          currency = "usd";
          available = true;
          createdAt = Time.now();
        };
        serverPlans.add("Standard", standardPlan);
      };
      case (?_) {};
    };

    switch (serverPlans.get("Pro")) {
      case (null) {
        let proPlan = {
          id = "Pro";
          name = "Pro";
          cpu = "8 cores";
          ram = "16GB";
          storage = "500GB";
          bandwidth = "5TB";
          location = "data center";
          pricePerMonth = 4000;
          currency = "usd";
          available = true;
          createdAt = Time.now();
        };
        serverPlans.add("Pro", proPlan);
      };
      case (?_) {};
    };
  };

  // Server Plans
  public shared ({ caller }) func addServerPlan(
    name : Text,
    cpu : Text,
    ram : Text,
    storage : Text,
    bandwidth : Text,
    location : Text,
    pricePerMonth : Nat,
    currency : Text,
    available : Bool
  ) : async ServerPlan {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add plans");
    };

    let id = generateId("plan");
    let plan : ServerPlan = {
      id;
      name;
      cpu;
      ram;
      storage;
      bandwidth;
      location;
      pricePerMonth;
      currency;
      available;
      createdAt = Time.now();
    };

    serverPlans.add(id, plan);
    plan;
  };

  public shared ({ caller }) func updateServerPlan(planId : Text, update : UpdatePlanInput) : async ServerPlan {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update plans");
    };

    switch (serverPlans.get(planId)) {
      case (null) { Runtime.trap("Plan not found") };
      case (?existing) {
        let updated : ServerPlan = {
          id = planId;
          name = update.name;
          cpu = update.cpu;
          ram = update.ram;
          storage = update.storage;
          bandwidth = update.bandwidth;
          location = update.location;
          pricePerMonth = update.pricePerMonth;
          currency = update.currency;
          available = update.available;
          createdAt = existing.createdAt;
        };
        serverPlans.add(planId, updated);
        updated;
      };
    };
  };

  public shared ({ caller }) func removeServerPlan(planId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete plans");
    };

    if (not (serverPlans.containsKey(planId))) {
      Runtime.trap("Plan not found");
    };
    serverPlans.remove(planId);
  };

  public query ({ caller }) func getServerPlans() : async [ServerPlan] {
    // Anyone can get server plans
    serverPlans.values().toArray();
  };

  public query ({ caller }) func getPlanById(planId : Text) : async ServerPlan {
    switch (serverPlans.get(planId)) {
      case (null) { Runtime.trap("Plan not found") };
      case (?plan) { plan };
    };
  };

  // Custom Server Plan Functionality
  public shared ({ caller }) func addCustomServerToCart(config : CustomServerConfig) : async ShoppingCart {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add custom servers to cart");
    };

    let customPlan : ServerPlan = {
      id = generateId("custom");
      name = "Custom Server";
      cpu = config.cpuCores.toText() # " cores";
      ram = config.ramGb.toText() # "GB";
      storage = config.storageGb.toText() # "GB";
      bandwidth = config.bandwidthMbps.toText() # "Mbps";
      location = config.location;
      pricePerMonth = calculateCustomServerPrice(config) / config.durationMonths;
      currency = "usd";
      available = true;
      createdAt = Time.now();
    };

    let currentCart = getCurrentCart(caller);
    let newItems = currentCart.items.concat([customPlan]);
    let updatedCart : ShoppingCart = {
      items = newItems;
      total = currentCart.total + (customPlan.pricePerMonth * config.durationMonths);
      currency = customPlan.currency;
      createdAt = Time.now();
    };

    activeCarts.add(caller, updatedCart);
    updatedCart;
  };

  // Shopping Cart
  public shared ({ caller }) func addToCart(planId : Text) : async ShoppingCart {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add items to cart");
    };

    switch (serverPlans.get(planId)) {
      case (null) { Runtime.trap("Plan not found") };
      case (?plan) {
        if (not plan.available) {
          Runtime.trap("This plan is not currently available");
        };

        let currentCart = getCurrentCart(caller);
        let newItems = currentCart.items.concat([plan]);
        let updatedCart : ShoppingCart = {
          items = newItems;
          total = currentCart.total + plan.pricePerMonth;
          currency = plan.currency;
          createdAt = Time.now();
        };

        activeCarts.add(caller, updatedCart);
        updatedCart;
      };
    };
  };

  public shared ({ caller }) func removeFromCart(planId : Text) : async ShoppingCart {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove items from cart");
    };

    let currentCart = getCurrentCart(caller);
    let filteredItems = currentCart.items.filter(
      func(item) { item.id != planId }
    );
    let updatedCart : ShoppingCart = {
      items = filteredItems;
      total = switch (serverPlans.get(planId)) {
        case (null) { currentCart.total };
        case (?plan) {
          if (currentCart.total >= plan.pricePerMonth) {
            currentCart.total - plan.pricePerMonth;
          } else { 0 };
        };
      };
      currency = currentCart.currency;
      createdAt = currentCart.createdAt;
    };

    activeCarts.add(caller, updatedCart);
    updatedCart;
  };

  public query ({ caller }) func getCart() : async ShoppingCart {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cart");
    };
    getCurrentCart(caller);
  };

  public shared ({ caller }) func clearCart() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear cart");
    };
    activeCarts.remove(caller);
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfig := ?config;
  };

  public query func isStripeConfigured() : async Bool {
    switch (stripeConfig) {
      case (null) { false };
      case (?_) { true };
    };
  };

  func getStripeConfig() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be configured") };
      case (?config) { config };
    };
  };

  func convertToShoppingItem(plan : ServerPlan) : Stripe.ShoppingItem {
    {
      currency = plan.currency;
      productName = plan.name;
      productDescription = plan.cpu # ", " # plan.ram;
      priceInCents = plan.pricePerMonth;
      quantity = 1;
    };
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func createCheckoutSession(
    items : [Stripe.ShoppingItem],
    successUrl : Text,
    cancelUrl : Text
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can initiate a checkout session");
    };
    await Stripe.createCheckoutSession(getStripeConfig(), caller, items, successUrl, cancelUrl, transform);
  };

  public shared ({ caller }) func checkout(successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can checkout");
    };

    let cartItems = getCurrentCart(caller).items;
    if (cartItems.size() == 0) {
      Runtime.trap("Cart is empty");
    };

    let stripeItems = cartItems.map(convertToShoppingItem);

    let sessionId = await Stripe.createCheckoutSession(getStripeConfig(), caller, stripeItems, successUrl, cancelUrl, transform);

    // Store session ownership for later verification
    checkoutSessions.add(sessionId, caller);

    sessionId;
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfig(), sessionId, transform);
  };

  public shared ({ caller }) func getPaymentStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    // Verify caller owns this session or is admin
    switch (checkoutSessions.get(sessionId)) {
      case (null) { Runtime.trap("Session not found") };
      case (?owner) {
        if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own payment status");
        };
      };
    };

    await Stripe.getSessionStatus(getStripeConfig(), sessionId, transform);
  };

  // User Management
  public shared ({ caller }) func registerUser(name : Text, email : Text) : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register");
    };

    if (userProfiles.containsKey(caller)) {
      Runtime.trap("Already registered");
    };

    let user : UserProfile = {
      principal = caller;
      name;
      email;
      createdAt = Time.now();
    };

    userProfiles.add(caller, user);
    user;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    // Ensure user can only save their own profile
    let updatedProfile : UserProfile = {
      principal = caller;
      name = profile.name;
      email = profile.email;
      createdAt = switch (userProfiles.get(caller)) {
        case (null) { Time.now() };
        case (?existing) { existing.createdAt };
      };
    };

    userProfiles.add(caller, updatedProfile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public query ({ caller }) func getCurrentUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserById(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Admin functions for order and user management
  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray();
  };

  public query ({ caller }) func getUserOrders(user : Principal) : async [Order] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own orders");
    };
    orders.values().filter(func(order) { order.user == user }).toArray();
  };

  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    userProfiles.values().toArray();
  };

  public query ({ caller }) func getUserInvoices(user : Principal) : async [Invoice] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own invoices");
    };
    invoices.values().filter(func(invoice) { invoice.user == user }).toArray();
  };

  public query ({ caller }) func getAllInvoices() : async [Invoice] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all invoices");
    };
    invoices.values().toArray();
  };

  public query func hasAdmin() : async Bool {
    accessControlState.adminAssigned;
  };

  public query ({ caller }) func checkAdminStatus() : async CheckResult {
    let hasAdmin = accessControlState.adminAssigned;
    {
      hasAdmin;
      adminCount = if (hasAdmin) { 1 } else { 0 };
      isAnonymous = caller == Principal.anonymous();
    };
  };

  public shared ({ caller }) func autoAssignAdminOnLogin() : async Bool {
    if (accessControlState.adminAssigned) {
      return false;
    };
    if (caller == Principal.anonymous()) {
      return false;
    };

    // Attempt to assign the role to itself for the first authenticated user.
    // The authorization check will confirm for all later attemters that this action is admin only.
    AccessControl.assignRole(
      accessControlState,
      caller,
      caller,
      #admin,
    );

    // Validation that admin is assigned otherwise user does not know
    if (not accessControlState.adminAssigned) {
      Runtime.trap("Internal error: Admin assignment failed");
    };
    true;
  };

  public shared ({ caller }) func promoteToAdminIfNeeded() : async () {
    switch (accessControlState.adminAssigned, caller == Principal.anonymous()) {
      case (true, true) { Runtime.trap("Unauthorized: At least one admin already exists. Only existing authenticated admins can assign roles. Anonymous users are not allowed."); };
      case (true, false) { Runtime.trap("Unauthorized: At least one admin already exists. Only existing authenticated admins can assign roles."); };
      case (false, true) { Runtime.trap("Unauthorized: Anonymous users cannot assume admin role while no admin exists."); };
      case (false, false) {};
    };

    // Attempt to assign the role to itself for the first authenticated user.
    // The authorization check will confirm for all later attemters that this action is admin only.
    AccessControl.assignRole(
      accessControlState,
      caller,
      caller,
      #admin,
    );
  };

  public query ({ caller }) func allUsers() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    userProfiles.values().toArray();
  };

  public query func isAdminSetUp() : async Bool {
    accessControlState.adminAssigned;
  };

  public shared ({ caller }) func resetAdminState() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reset admin state");
    };
    accessControlState.adminAssigned := false;
  };

  public shared ({ caller }) func createAdminInvitation() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create invitation codes");
    };
    let uniqueCode = generateId("invite");
    adminInvitations.add(uniqueCode, caller);
    uniqueCode;
  };

  public shared ({ caller }) func redeemAdminInvitation(code : Text) : async Bool {
    // Prevent anonymous users from redeeming invitations
    if (caller == Principal.anonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot redeem invitation codes");
    };

    switch (adminInvitations.get(code)) {
      case (null) { Runtime.trap("Invalid invitation code") };
      case (?_inviter) {
        AccessControl.assignRole(
          accessControlState,
          caller,
          caller,
          #admin,
        );
        adminInvitations.remove(code);
        true;
      };
    };
  };

  public shared ({ caller }) func isInvitationCodeValid(_code : Text) : async Bool {
    // Require authenticated user to check invitation validity
    if (caller == Principal.anonymous()) {
      Runtime.trap("Unauthorized: Only authenticated users can check invitation codes");
    };

    switch (adminInvitations.get(_code)) {
      case (null) { false };
      case (?_sender) { true };
    };
  };

  public query ({ caller }) func getInvitationCodes() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view invitation codes");
    };
    let codes = adminInvitations.toArray();
    let allCodes = codes.map(func((k, _)) { k });
    allCodes;
  };

  public query ({ caller }) func getActiveInvitations() : async [(Text, Principal)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view active invitations");
    };
    adminInvitations.toArray();
  };

  public type InvitationStatus = {
    #found : { sender : Principal };
    #expired;
    #notFound;
    #used;
  };

  public query ({ caller }) func verifyInvitationCode(code : Text) : async InvitationStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can verify invitation codes");
    };

    switch (adminInvitations.get(code)) {
      case (null) {
        #notFound;
      };
      case (?sender) {
        #found { sender };
      };
    };
  };

  // Dedicated Server Management
  public shared ({ caller }) func createDedicatedServer(
    id : Text,
    name : Text,
    cpuCores : Nat,
    ramGb : Nat,
    storageGb : Nat
  ) : async DedicatedServer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create servers");
    };

    let server : DedicatedServer = {
      id;
      name;
      cpuCores;
      ramGb;
      storageGb;
      status = #available;
      assignedTo = null;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    dedicatedServers.add(id, server);
    server;
  };

  public shared ({ caller }) func deleteDedicatedServer(serverId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete servers");
    };
    if (not (dedicatedServers.containsKey(serverId))) {
      Runtime.trap("Server not found");
    };
    dedicatedServers.remove(serverId);
  };

  public query ({ caller }) func getDedicatedServer(serverId : Text) : async DedicatedServer {
    switch (dedicatedServers.get(serverId)) {
      case (null) { Runtime.trap("Server not found") };
      case (?server) {
        // Allow access if: admin OR user owns the server
        let isOwner = switch (server.assignedTo) {
          case (null) { false };
          case (?#user(user)) { user == caller };
          case (?#plan(_)) { false };
        };
        if (not (AccessControl.isAdmin(accessControlState, caller) or isOwner)) {
          Runtime.trap("Unauthorized: Can only view your own servers or admin access required");
        };
        server;
      };
    };
  };

  public query ({ caller }) func getAllDedicatedServers() : async [DedicatedServer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all servers");
    };
    dedicatedServers.values().toArray();
  };

  public shared ({ caller }) func assignServerToUser(serverId : Text, user : Principal) : async DedicatedServer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can assign servers");
    };

    switch (dedicatedServers.get(serverId)) {
      case (null) { Runtime.trap("Server not found") };
      case (?server) {
        if (server.status != #available) {
          Runtime.trap("Server is not available for assignment");
        };
        let updated : DedicatedServer = {
          server with assignedTo = ?#user user; status = #assigned; updatedAt = Time.now()
        };
        dedicatedServers.add(serverId, updated);
        updated;
      };
    };
  };

  public shared ({ caller }) func assignServerToPlan(serverId : Text, planId : Text) : async DedicatedServer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can assign servers");
    };

    switch (dedicatedServers.get(serverId)) {
      case (null) { Runtime.trap("Server not found") };
      case (?server) {
        if (server.status != #available) {
          Runtime.trap("Server is not available for assignment");
        };
        let updated : DedicatedServer = {
          server with assignedTo = ?#plan planId; status = #assigned; updatedAt = Time.now()
        };
        dedicatedServers.add(serverId, updated);
        updated;
      };
    };
  };
};
