/**
 * USAP ERP — qbXML Response Parser
 * Reads QB response XML and upserts data into Supabase tables
 */

function getAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out: string[] = [];
  let m;
  while ((m = re.exec(xml)) !== null) out.push(m[1].trim());
  return out;
}

function get(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

function num(val: string): number | null {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

// ─── Individual record parsers ───────────────────────────────────────────────

function parseCustomerRet(xml: string): any {
  return {
    qb_list_id:              get(xml, "ListID"),
    qb_edit_sequence:        get(xml, "EditSequence"),
    name:                    get(xml, "FullName") || get(xml, "Name"),
    company:                 get(xml, "CompanyName") || null,
    email:                   get(xml, "Email") || null,
    phone:                   get(xml, "Phone") || null,
    alt_phone:               get(xml, "AltPhone") || null,
    fax:                     get(xml, "Fax") || null,
    billing_address_line1:   get(xml, "BillAddress>Addr1") !== "" ? get(xml, "Addr1") : null,
    billing_address_line2:   get(xml, "BillAddress>Addr2") !== "" ? get(xml, "Addr2") : null,
    billing_city:            get(xml, "BillAddress>City") || null,
    billing_state:           get(xml, "BillAddress>State") || null,
    billing_zip:             get(xml, "BillAddress>PostalCode") || null,
    billing_country:         get(xml, "BillAddress>Country") || null,
    balance:                 num(get(xml, "Balance")),
    credit_limit:            num(get(xml, "CreditLimit")),
    is_active:               get(xml, "IsActive") !== "false",
    qb_synced_at:            new Date().toISOString(),
  };
}

function parseVendorRet(xml: string): any {
  return {
    qb_list_id:              get(xml, "ListID"),
    qb_edit_sequence:        get(xml, "EditSequence"),
    name:                    get(xml, "Name"),
    company:                 get(xml, "CompanyName") || null,
    email:                   get(xml, "Email") || null,
    phone:                   get(xml, "Phone") || null,
    alt_phone:               get(xml, "AltPhone") || null,
    billing_address_line1:   get(xml, "Addr1") || null,
    billing_city:            get(xml, "City") || null,
    billing_state:           get(xml, "State") || null,
    billing_zip:             get(xml, "PostalCode") || null,
    balance:                 num(get(xml, "Balance")),
    account_number:          get(xml, "VendorAccountNumber") || null,
    is_active:               get(xml, "IsActive") !== "false",
    qb_synced_at:            new Date().toISOString(),
  };
}

function parseItemRet(xml: string): any {
  const typeMap: Record<string, string> = {
    ItemInventoryRet:    "Inventory",
    ItemNonInventoryRet: "NonInventory",
    ItemServiceRet:      "Service",
    ItemOtherChargeRet:  "OtherCharge",
    ItemSubtotalRet:     "Subtotal",
    ItemDiscountRet:     "Discount",
    ItemGroupRet:        "Group",
  };
  // Detect type from wrapping tag
  let itemType = "NonInventory";
  for (const [tag, type] of Object.entries(typeMap)) {
    if (xml.includes(`<${tag}>`) || xml.includes(`<${tag} `)) {
      itemType = type;
      break;
    }
  }
  return {
    qb_list_id:         get(xml, "ListID"),
    qb_edit_sequence:   get(xml, "EditSequence"),
    item_type:          itemType,
    name:               get(xml, "FullName") || get(xml, "Name"),
    description:        get(xml, "SalesDesc") || get(xml, "Desc") || null,
    purchase_description: get(xml, "PurchaseDesc") || null,
    sales_price:        num(get(xml, "SalesPrice")),
    purchase_cost:      num(get(xml, "PurchaseCost")),
    quantity_on_hand:   num(get(xml, "QuantityOnHand")),
    reorder_point:      num(get(xml, "ReorderPoint")),
    is_active:          get(xml, "IsActive") !== "false",
    qb_synced_at:       new Date().toISOString(),
  };
}

function parseAccountRet(xml: string): any {
  return {
    qb_list_id:       get(xml, "ListID"),
    qb_edit_sequence: get(xml, "EditSequence"),
    name:             get(xml, "Name"),
    full_name:        get(xml, "FullName") || null,
    account_type:     get(xml, "AccountType"),
    account_number:   get(xml, "AccountNumber") || null,
    description:      get(xml, "Desc") || null,
    balance:          num(get(xml, "Balance")),
    is_active:        get(xml, "IsActive") !== "false",
    qb_synced_at:     new Date().toISOString(),
  };
}

function parseInvoiceRet(xml: string, customerId: string | null): any {
  return {
    qb_txn_id:        get(xml, "TxnID"),
    qb_edit_sequence: get(xml, "EditSequence"),
    invoice_number:   get(xml, "RefNumber") || null,
    customer_id:      customerId,
    invoice_date:     get(xml, "TxnDate"),
    due_date:         get(xml, "DueDate") || null,
    po_number:        get(xml, "PONumber") || null,
    subtotal:         num(get(xml, "Subtotal")),
    tax_amount:       num(get(xml, "SalesTaxTotal")),
    total:            num(get(xml, "TotalAmount")),
    balance_due:      num(get(xml, "BalanceRemaining")),
    memo:             get(xml, "Memo") || null,
    status:           get(xml, "IsPaid") === "true" ? "paid" : "open",
    qb_synced_at:     new Date().toISOString(),
  };
}

function parseSalesOrderRet(xml: string, customerId: string | null): any {
  return {
    qb_txn_id:        get(xml, "TxnID"),
    qb_edit_sequence: get(xml, "EditSequence"),
    order_number:     get(xml, "RefNumber") || null,
    customer_id:      customerId,
    order_date:       get(xml, "TxnDate"),
    due_date:         get(xml, "DueDate") || null,
    po_number:        get(xml, "PONumber") || null,
    subtotal:         num(get(xml, "Subtotal")),
    tax_amount:       num(get(xml, "SalesTaxTotal")),
    total:            num(get(xml, "TotalAmount")),
    memo:             get(xml, "Memo") || null,
    status:           get(xml, "IsFullyInvoiced") === "true" ? "closed" : "open",
    qb_synced_at:     new Date().toISOString(),
  };
}

function parsePurchaseOrderRet(xml: string, vendorId: string | null): any {
  return {
    qb_txn_id:        get(xml, "TxnID"),
    qb_edit_sequence: get(xml, "EditSequence"),
    po_number:        get(xml, "RefNumber") || null,
    vendor_id:        vendorId,
    order_date:       get(xml, "TxnDate"),
    expected_date:    get(xml, "ExpectedDate") || null,
    subtotal:         num(get(xml, "Subtotal")),
    total:            num(get(xml, "TotalAmount")),
    memo:             get(xml, "Memo") || null,
    status:           get(xml, "IsFullyReceived") === "true" ? "received" : "open",
    qb_synced_at:     new Date().toISOString(),
  };
}

function parseBillRet(xml: string, vendorId: string | null): any {
  return {
    qb_txn_id:        get(xml, "TxnID"),
    qb_edit_sequence: get(xml, "EditSequence"),
    vendor_id:        vendorId,
    bill_date:        get(xml, "TxnDate"),
    due_date:         get(xml, "DueDate") || null,
    ref_number:       get(xml, "RefNumber") || null,
    total:            num(get(xml, "TotalAmount")),
    balance_due:      num(get(xml, "AmountDue")),
    memo:             get(xml, "Memo") || null,
    status:           num(get(xml, "AmountDue")) === 0 ? "paid" : "open",
    qb_synced_at:     new Date().toISOString(),
  };
}

function parseEstimateRet(xml: string, customerId: string | null): any {
  return {
    qb_txn_id:        get(xml, "TxnID"),
    qb_edit_sequence: get(xml, "EditSequence"),
    estimate_number:  get(xml, "RefNumber") || null,
    customer_id:      customerId,
    estimate_date:    get(xml, "TxnDate"),
    subtotal:         num(get(xml, "Subtotal")),
    total:            num(get(xml, "TotalAmount")),
    memo:             get(xml, "Memo") || null,
    status:           get(xml, "IsActive") === "false" ? "voided" : "active",
    qb_synced_at:     new Date().toISOString(),
  };
}

function parsePaymentRet(xml: string, customerId: string | null): any {
  return {
    qb_txn_id:        get(xml, "TxnID"),
    qb_edit_sequence: get(xml, "EditSequence"),
    customer_id:      customerId,
    payment_date:     get(xml, "TxnDate"),
    amount:           num(get(xml, "TotalAmount")),
    payment_method:   get(xml, "PaymentMethodRef>FullName") || null,
    reference_number: get(xml, "RefNumber") || null,
    memo:             get(xml, "Memo") || null,
    qb_synced_at:     new Date().toISOString(),
  };
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function parseQbXmlResponse(job: any, xml: string, supabase: any): Promise<void> {
  const { entity_type, entity_id, qb_action, direction } = job;

  // ── to_qb: just capture QB-assigned IDs back into the local record ───────
  if (direction === "to_qb") {
    const listId     = get(xml, "ListID");
    const txnId      = get(xml, "TxnID");
    const editSeq    = get(xml, "EditSequence");

    const isListEntity = ["customers", "vendors", "items", "accounts", "terms", "sales_tax_codes"].includes(entity_type);

    if (isListEntity && listId) {
      await supabase.from(entity_type).update({
        qb_list_id: listId,
        qb_edit_sequence: editSeq,
        qb_synced_at: new Date().toISOString(),
      }).eq("id", entity_id);
    } else if (txnId) {
      await supabase.from(entity_type).update({
        qb_txn_id: txnId,
        qb_edit_sequence: editSeq,
        qb_synced_at: new Date().toISOString(),
      }).eq("id", entity_id);
    }
    return;
  }

  // ── from_qb: full upsert of all returned records ─────────────────────────

  if (entity_type === "customers") {
    const rets = getAll(xml, "CustomerRet");
    for (const ret of rets) {
      const rec = parseCustomerRet(ret);
      await supabase.from("customers").upsert(rec, { onConflict: "qb_list_id" });
    }
    return;
  }

  if (entity_type === "vendors") {
    const rets = getAll(xml, "VendorRet");
    for (const ret of rets) {
      const rec = parseVendorRet(ret);
      await supabase.from("vendors").upsert(rec, { onConflict: "qb_list_id" });
    }
    return;
  }

  if (entity_type === "items") {
    // Items can come back as various types
    const itemTags = ["ItemInventoryRet","ItemNonInventoryRet","ItemServiceRet","ItemOtherChargeRet","ItemGroupRet","ItemDiscountRet","ItemSubtotalRet"];
    for (const tag of itemTags) {
      const rets = getAll(xml, tag);
      for (const ret of rets) {
        const rec = parseItemRet(`<${tag}>${ret}</${tag}>`);
        await supabase.from("items").upsert(rec, { onConflict: "qb_list_id" });
      }
    }
    return;
  }

  if (entity_type === "accounts") {
    const rets = getAll(xml, "AccountRet");
    for (const ret of rets) {
      const rec = parseAccountRet(ret);
      await supabase.from("accounts").upsert(rec, { onConflict: "qb_list_id" });
    }
    return;
  }

  if (entity_type === "invoices") {
    const rets = getAll(xml, "InvoiceRet");
    for (const ret of rets) {
      const customerQbId = get(ret, "CustomerRef>ListID");
      let customerId: string | null = null;
      if (customerQbId) {
        const { data } = await supabase.from("customers").select("id").eq("qb_list_id", customerQbId).single();
        customerId = data?.id || null;
      }
      const rec = parseInvoiceRet(ret, customerId);
      const { data: inv } = await supabase.from("invoices").upsert(rec, { onConflict: "qb_txn_id" }).select("id").single();

      if (inv?.id) {
        // Upsert line items
        const lineRets = getAll(ret, "InvoiceLineRet");
        for (const [i, lr] of lineRets.entries()) {
          const itemQbId = get(lr, "ItemRef>ListID");
          let itemId: string | null = null;
          if (itemQbId) {
            const { data } = await supabase.from("items").select("id").eq("qb_list_id", itemQbId).single();
            itemId = data?.id || null;
          }
          await supabase.from("invoice_lines").upsert({
            invoice_id: inv.id,
            qb_txn_line_id: get(lr, "TxnLineID"),
            item_id: itemId,
            description: get(lr, "Desc") || null,
            quantity: num(get(lr, "Quantity")) ?? 1,
            unit_price: num(get(lr, "Rate")) ?? 0,
            sort_order: i,
          }, { onConflict: "qb_txn_line_id" });
        }
      }
    }
    return;
  }

  if (entity_type === "sales_orders") {
    const rets = getAll(xml, "SalesOrderRet");
    for (const ret of rets) {
      const customerQbId = get(ret, "CustomerRef>ListID");
      let customerId: string | null = null;
      if (customerQbId) {
        const { data } = await supabase.from("customers").select("id").eq("qb_list_id", customerQbId).single();
        customerId = data?.id || null;
      }
      const rec = parseSalesOrderRet(ret, customerId);
      const { data: so } = await supabase.from("sales_orders").upsert(rec, { onConflict: "qb_txn_id" }).select("id").single();
      if (so?.id) {
        const lineRets = getAll(ret, "SalesOrderLineRet");
        for (const [i, lr] of lineRets.entries()) {
          const itemQbId = get(lr, "ItemRef>ListID");
          let itemId: string | null = null;
          if (itemQbId) {
            const { data } = await supabase.from("items").select("id").eq("qb_list_id", itemQbId).single();
            itemId = data?.id || null;
          }
          await supabase.from("sales_order_lines").upsert({
            sales_order_id: so.id,
            qb_txn_line_id: get(lr, "TxnLineID"),
            item_id: itemId,
            description: get(lr, "Desc") || null,
            quantity: num(get(lr, "Quantity")) ?? 1,
            unit_price: num(get(lr, "Rate")) ?? 0,
            sort_order: i,
          }, { onConflict: "qb_txn_line_id" });
        }
      }
    }
    return;
  }

  if (entity_type === "purchase_orders") {
    const rets = getAll(xml, "PurchaseOrderRet");
    for (const ret of rets) {
      const vendorQbId = get(ret, "VendorRef>ListID");
      let vendorId: string | null = null;
      if (vendorQbId) {
        const { data } = await supabase.from("vendors").select("id").eq("qb_list_id", vendorQbId).single();
        vendorId = data?.id || null;
      }
      const rec = parsePurchaseOrderRet(ret, vendorId);
      await supabase.from("purchase_orders").upsert(rec, { onConflict: "qb_txn_id" });
    }
    return;
  }

  if (entity_type === "bills") {
    const rets = getAll(xml, "BillRet");
    for (const ret of rets) {
      const vendorQbId = get(ret, "VendorRef>ListID");
      let vendorId: string | null = null;
      if (vendorQbId) {
        const { data } = await supabase.from("vendors").select("id").eq("qb_list_id", vendorQbId).single();
        vendorId = data?.id || null;
      }
      const rec = parseBillRet(ret, vendorId);
      await supabase.from("bills").upsert(rec, { onConflict: "qb_txn_id" });
    }
    return;
  }

  if (entity_type === "estimates") {
    const rets = getAll(xml, "EstimateRet");
    for (const ret of rets) {
      const customerQbId = get(ret, "CustomerRef>ListID");
      let customerId: string | null = null;
      if (customerQbId) {
        const { data } = await supabase.from("customers").select("id").eq("qb_list_id", customerQbId).single();
        customerId = data?.id || null;
      }
      const rec = parseEstimateRet(ret, customerId);
      await supabase.from("estimates").upsert(rec, { onConflict: "qb_txn_id" });
    }
    return;
  }

  if (entity_type === "payments_received") {
    const rets = getAll(xml, "ReceivePaymentRet");
    for (const ret of rets) {
      const customerQbId = get(ret, "CustomerRef>ListID");
      let customerId: string | null = null;
      if (customerQbId) {
        const { data } = await supabase.from("customers").select("id").eq("qb_list_id", customerQbId).single();
        customerId = data?.id || null;
      }
      const rec = parsePaymentRet(ret, customerId);
      await supabase.from("payments_received").upsert(rec, { onConflict: "qb_txn_id" });
    }
    return;
  }

  if (entity_type === "terms") {
    const rets = getAll(xml, "TermsRet").concat(getAll(xml, "StandardTermsRet"));
    for (const ret of rets) {
      await supabase.from("terms").upsert({
        qb_list_id:    get(ret, "ListID"),
        qb_edit_sequence: get(ret, "EditSequence"),
        name:          get(ret, "Name"),
        due_days:      parseInt(get(ret, "StdDueDays")) || null,
        discount_days: parseInt(get(ret, "StdDiscountDays")) || null,
        discount_pct:  num(get(ret, "DiscountPct")),
        is_active:     get(ret, "IsActive") !== "false",
        qb_synced_at:  new Date().toISOString(),
      }, { onConflict: "qb_list_id" });
    }
    return;
  }

  if (entity_type === "sales_tax_codes") {
    const rets = getAll(xml, "SalesTaxCodeRet");
    for (const ret of rets) {
      await supabase.from("sales_tax_codes").upsert({
        qb_list_id:    get(ret, "ListID"),
        qb_edit_sequence: get(ret, "EditSequence"),
        name:          get(ret, "Name"),
        description:   get(ret, "Desc") || null,
        is_taxable:    get(ret, "IsTaxable") === "true",
        is_active:     get(ret, "IsActive") !== "false",
        qb_synced_at:  new Date().toISOString(),
      }, { onConflict: "qb_list_id" });
    }
    return;
  }

  if (entity_type === "employees") {
    const rets = getAll(xml, "EmployeeRet");
    for (const ret of rets) {
      await supabase.from("employees").upsert({
        qb_list_id:    get(ret, "ListID"),
        qb_edit_sequence: get(ret, "EditSequence"),
        first_name:    get(ret, "FirstName") || null,
        last_name:     get(ret, "LastName") || null,
        email:         get(ret, "Email") || null,
        phone:         get(ret, "Phone") || null,
        is_active:     get(ret, "IsActive") !== "false",
        qb_synced_at:  new Date().toISOString(),
      }, { onConflict: "qb_list_id" });
    }
    return;
  }
}
