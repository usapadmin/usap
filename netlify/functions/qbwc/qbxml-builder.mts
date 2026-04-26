/**
 * USAP ERP — qbXML Request Builder
 * Builds QuickBooks XML requests for every entity type / action
 */

function qbxmlEnvelope(requestId: string, body: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="16.0"?>
<QBXML>
  <QBXMLMsgsRq onError="stopOnError">
    ${body}
  </QBXMLMsgsRq>
</QBXML>`;
}

function esc(val: any): string {
  if (val == null) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function optTag(tag: string, val: any): string {
  if (val == null || val === "") return "";
  return `<${tag}>${esc(val)}</${tag}>`;
}

function addressBlock(prefix: string, r: any): string {
  const a1 = r[`${prefix}_line1`];
  const a2 = r[`${prefix}_line2`];
  const city = r[`${prefix}_city`];
  const state = r[`${prefix}_state`];
  const zip = r[`${prefix}_zip`];
  const country = r[`${prefix}_country`];
  if (!a1 && !city) return "";
  const tag = prefix.startsWith("billing") ? "BillAddress" : "ShipAddress";
  return `<${tag}>
      ${optTag("Addr1", a1)}
      ${optTag("Addr2", a2)}
      ${optTag("City", city)}
      ${optTag("State", state)}
      ${optTag("PostalCode", zip)}
      ${optTag("Country", country)}
    </${tag}>`;
}

// ─── Entity-specific builders ───────────────────────────────────────────────

function buildCustomerAdd(r: any): string {
  return `<CustomerAddRq requestID="cust-${r.id}">
    <CustomerAdd>
      <Name>${esc(r.name)}</Name>
      ${optTag("CompanyName", r.company)}
      ${optTag("Email", r.email)}
      ${optTag("Phone", r.phone)}
      ${optTag("AltPhone", r.alt_phone)}
      ${optTag("Fax", r.fax)}
      ${optTag("Contact", r.name)}
      ${addressBlock("billing_address", r)}
      ${addressBlock("shipping_address", r)}
      ${optTag("Notes", r.notes)}
      ${optTag("IsActive", r.is_active ? "true" : "false")}
    </CustomerAdd>
  </CustomerAddRq>`;
}

function buildCustomerMod(r: any): string {
  return `<CustomerModRq requestID="custmod-${r.id}">
    <CustomerMod>
      <ListID>${esc(r.qb_list_id)}</ListID>
      <EditSequence>${esc(r.qb_edit_sequence)}</EditSequence>
      <Name>${esc(r.name)}</Name>
      ${optTag("CompanyName", r.company)}
      ${optTag("Email", r.email)}
      ${optTag("Phone", r.phone)}
      ${optTag("AltPhone", r.alt_phone)}
      ${optTag("Fax", r.fax)}
      ${addressBlock("billing_address", r)}
      ${addressBlock("shipping_address", r)}
      ${optTag("Notes", r.notes)}
      ${optTag("IsActive", r.is_active ? "true" : "false")}
    </CustomerMod>
  </CustomerModRq>`;
}

function buildVendorAdd(r: any): string {
  return `<VendorAddRq requestID="vend-${r.id}">
    <VendorAdd>
      <Name>${esc(r.name)}</Name>
      ${optTag("CompanyName", r.company)}
      ${optTag("Email", r.email)}
      ${optTag("Phone", r.phone)}
      ${optTag("AltPhone", r.alt_phone)}
      ${optTag("Fax", r.fax)}
      ${addressBlock("billing_address", r)}
      ${optTag("VendorAccountNumber", r.account_number)}
      ${optTag("Notes", r.notes)}
      ${optTag("IsActive", r.is_active ? "true" : "false")}
    </VendorAdd>
  </VendorAddRq>`;
}

function buildVendorMod(r: any): string {
  return `<VendorModRq requestID="vendmod-${r.id}">
    <VendorMod>
      <ListID>${esc(r.qb_list_id)}</ListID>
      <EditSequence>${esc(r.qb_edit_sequence)}</EditSequence>
      <Name>${esc(r.name)}</Name>
      ${optTag("CompanyName", r.company)}
      ${optTag("Email", r.email)}
      ${optTag("Phone", r.phone)}
      ${addressBlock("billing_address", r)}
      ${optTag("VendorAccountNumber", r.account_number)}
      ${optTag("IsActive", r.is_active ? "true" : "false")}
    </VendorMod>
  </VendorModRq>`;
}

function buildItemAdd(r: any): string {
  const typeMap: Record<string, string> = {
    Inventory: "ItemInventoryAdd",
    NonInventory: "ItemNonInventoryAdd",
    Service: "ItemServiceAdd",
    OtherCharge: "ItemOtherChargeAdd",
  };
  const tag = typeMap[r.item_type] || "ItemNonInventoryAdd";
  const isInv = r.item_type === "Inventory";

  return `<${tag}Rq requestID="item-${r.id}">
    <${tag}>
      <Name>${esc(r.name)}</Name>
      ${optTag("IsActive", r.is_active ? "true" : "false")}
      ${optTag("SalesDesc", r.description)}
      ${r.sales_price != null ? `<SalesPrice>${r.sales_price}</SalesPrice>` : ""}
      ${optTag("PurchaseDesc", r.purchase_description)}
      ${r.purchase_cost != null ? `<PurchaseCost>${r.purchase_cost}</PurchaseCost>` : ""}
      ${isInv && r.quantity_on_hand != null
        ? `<QuantityOnHand>${r.quantity_on_hand}</QuantityOnHand>` : ""}
      ${isInv && r.reorder_point != null
        ? `<ReorderPoint>${r.reorder_point}</ReorderPoint>` : ""}
    </${tag}>
  </${tag}Rq>`;
}

function buildInvoiceAdd(r: any, lines: any[], customer: any): string {
  const lineXml = lines.map((l) => `
    <InvoiceLineAdd>
      ${l.qb_list_id ? `<ItemRef><ListID>${esc(l.qb_list_id)}</ListID></ItemRef>` : ""}
      ${optTag("Desc", l.description)}
      ${l.quantity != null ? `<Quantity>${l.quantity}</Quantity>` : ""}
      ${l.unit_price != null ? `<Rate>${l.unit_price}</Rate>` : ""}
    </InvoiceLineAdd>`).join("\n");

  return `<InvoiceAddRq requestID="inv-${r.id}">
    <InvoiceAdd>
      ${customer?.qb_list_id
        ? `<CustomerRef><ListID>${esc(customer.qb_list_id)}</ListID></CustomerRef>`
        : `<CustomerRef><FullName>${esc(customer?.name)}</FullName></CustomerRef>`}
      <TxnDate>${r.invoice_date}</TxnDate>
      ${optTag("RefNumber", r.invoice_number)}
      ${optTag("PONumber", r.po_number)}
      ${optTag("Memo", r.memo)}
      ${optTag("DueDate", r.due_date)}
      ${lineXml}
    </InvoiceAdd>
  </InvoiceAddRq>`;
}

function buildInvoiceMod(r: any, lines: any[], customer: any): string {
  const lineXml = lines.map((l) => `
    <InvoiceLineMod>
      ${l.qb_txn_line_id ? `<TxnLineID>${esc(l.qb_txn_line_id)}</TxnLineID>` : ""}
      ${l.qb_list_id ? `<ItemRef><ListID>${esc(l.qb_list_id)}</ListID></ItemRef>` : ""}
      ${optTag("Desc", l.description)}
      ${l.quantity != null ? `<Quantity>${l.quantity}</Quantity>` : ""}
      ${l.unit_price != null ? `<Rate>${l.unit_price}</Rate>` : ""}
    </InvoiceLineMod>`).join("\n");

  return `<InvoiceModRq requestID="invmod-${r.id}">
    <InvoiceMod>
      <TxnID>${esc(r.qb_txn_id)}</TxnID>
      <EditSequence>${esc(r.qb_edit_sequence)}</EditSequence>
      ${customer?.qb_list_id
        ? `<CustomerRef><ListID>${esc(customer.qb_list_id)}</ListID></CustomerRef>`
        : ""}
      <TxnDate>${r.invoice_date}</TxnDate>
      ${optTag("RefNumber", r.invoice_number)}
      ${optTag("Memo", r.memo)}
      ${lineXml}
    </InvoiceMod>
  </InvoiceModRq>`;
}

function buildSalesOrderAdd(r: any, lines: any[], customer: any): string {
  const lineXml = lines.map((l) => `
    <SalesOrderLineAdd>
      ${l.qb_list_id ? `<ItemRef><ListID>${esc(l.qb_list_id)}</ListID></ItemRef>` : ""}
      ${optTag("Desc", l.description)}
      ${l.quantity != null ? `<Quantity>${l.quantity}</Quantity>` : ""}
      ${l.unit_price != null ? `<Rate>${l.unit_price}</Rate>` : ""}
    </SalesOrderLineAdd>`).join("\n");

  return `<SalesOrderAddRq requestID="so-${r.id}">
    <SalesOrderAdd>
      ${customer?.qb_list_id
        ? `<CustomerRef><ListID>${esc(customer.qb_list_id)}</ListID></CustomerRef>`
        : `<CustomerRef><FullName>${esc(customer?.name)}</FullName></CustomerRef>`}
      <TxnDate>${r.order_date}</TxnDate>
      ${optTag("RefNumber", r.order_number)}
      ${optTag("PONumber", r.po_number)}
      ${optTag("Memo", r.memo)}
      ${optTag("DueDate", r.due_date)}
      ${lineXml}
    </SalesOrderAdd>
  </SalesOrderAddRq>`;
}

function buildPurchaseOrderAdd(r: any, lines: any[], vendor: any): string {
  const lineXml = lines.map((l) => `
    <PurchaseOrderLineAdd>
      ${l.qb_list_id ? `<ItemRef><ListID>${esc(l.qb_list_id)}</ListID></ItemRef>` : ""}
      ${optTag("Desc", l.description)}
      ${l.quantity != null ? `<Quantity>${l.quantity}</Quantity>` : ""}
      ${l.unit_cost != null ? `<Rate>${l.unit_cost}</Rate>` : ""}
    </PurchaseOrderLineAdd>`).join("\n");

  return `<PurchaseOrderAddRq requestID="po-${r.id}">
    <PurchaseOrderAdd>
      ${vendor?.qb_list_id
        ? `<VendorRef><ListID>${esc(vendor.qb_list_id)}</ListID></VendorRef>`
        : `<VendorRef><FullName>${esc(vendor?.name)}</FullName></VendorRef>`}
      <TxnDate>${r.order_date}</TxnDate>
      ${optTag("RefNumber", r.po_number)}
      ${optTag("ExpectedDate", r.expected_date)}
      ${optTag("Memo", r.memo)}
      ${lineXml}
    </PurchaseOrderAdd>
  </PurchaseOrderAddRq>`;
}

function buildBillAdd(r: any, lines: any[], vendor: any): string {
  const lineXml = lines.map((l) => `
    <ItemLineAdd>
      ${l.qb_list_id ? `<ItemRef><ListID>${esc(l.qb_list_id)}</ListID></ItemRef>` : ""}
      ${optTag("Desc", l.description)}
      ${l.quantity != null ? `<Quantity>${l.quantity}</Quantity>` : ""}
      ${l.unit_cost != null ? `<Cost>${l.unit_cost}</Cost>` : ""}
    </ItemLineAdd>`).join("\n");

  return `<BillAddRq requestID="bill-${r.id}">
    <BillAdd>
      ${vendor?.qb_list_id
        ? `<VendorRef><ListID>${esc(vendor.qb_list_id)}</ListID></VendorRef>`
        : `<VendorRef><FullName>${esc(vendor?.name)}</FullName></VendorRef>`}
      <TxnDate>${r.bill_date}</TxnDate>
      ${optTag("RefNumber", r.ref_number)}
      ${optTag("DueDate", r.due_date)}
      ${optTag("Memo", r.memo)}
      ${lineXml}
    </BillAdd>
  </BillAddRq>`;
}

function buildEstimateAdd(r: any, lines: any[], customer: any): string {
  const lineXml = lines.map((l) => `
    <EstimateLineAdd>
      ${l.qb_list_id ? `<ItemRef><ListID>${esc(l.qb_list_id)}</ListID></ItemRef>` : ""}
      ${optTag("Desc", l.description)}
      ${l.quantity != null ? `<Quantity>${l.quantity}</Quantity>` : ""}
      ${l.unit_price != null ? `<Rate>${l.unit_price}</Rate>` : ""}
    </EstimateLineAdd>`).join("\n");

  return `<EstimateAddRq requestID="est-${r.id}">
    <EstimateAdd>
      ${customer?.qb_list_id
        ? `<CustomerRef><ListID>${esc(customer.qb_list_id)}</ListID></CustomerRef>`
        : `<CustomerRef><FullName>${esc(customer?.name)}</FullName></CustomerRef>`}
      <TxnDate>${r.estimate_date}</TxnDate>
      ${optTag("RefNumber", r.estimate_number)}
      ${optTag("Memo", r.memo)}
      ${lineXml}
    </EstimateAdd>
  </EstimateAddRq>`;
}

function buildReceivePaymentAdd(r: any, customer: any): string {
  return `<ReceivePaymentAddRq requestID="pmt-${r.id}">
    <ReceivePaymentAdd>
      ${customer?.qb_list_id
        ? `<CustomerRef><ListID>${esc(customer.qb_list_id)}</ListID></CustomerRef>`
        : `<CustomerRef><FullName>${esc(customer?.name)}</FullName></CustomerRef>`}
      <TxnDate>${r.payment_date}</TxnDate>
      <TotalAmount>${r.amount}</TotalAmount>
      ${optTag("RefNumber", r.reference_number)}
      ${optTag("Memo", r.memo)}
    </ReceivePaymentAdd>
  </ReceivePaymentAddRq>`;
}

// Full sync queries - for from_qb direction
function buildQueryAll(entityType: string): string {
  const queryMap: Record<string, string> = {
    customers:         `<CustomerQueryRq requestID="qall-cust"><ActiveStatus>All</ActiveStatus></CustomerQueryRq>`,
    vendors:           `<VendorQueryRq requestID="qall-vend"><ActiveStatus>All</ActiveStatus></VendorQueryRq>`,
    items:             `<ItemQueryRq requestID="qall-item"><ActiveStatus>All</ActiveStatus></ItemQueryRq>`,
    accounts:          `<AccountQueryRq requestID="qall-acct"><ActiveStatus>All</ActiveStatus></AccountQueryRq>`,
    invoices:          `<InvoiceQueryRq requestID="qall-inv"><ModifiedDateRangeFilter><FromModifiedDate>2020-01-01</FromModifiedDate></ModifiedDateRangeFilter></InvoiceQueryRq>`,
    sales_orders:      `<SalesOrderQueryRq requestID="qall-so"><ActiveStatus>All</ActiveStatus></SalesOrderQueryRq>`,
    purchase_orders:   `<PurchaseOrderQueryRq requestID="qall-po"><ActiveStatus>All</ActiveStatus></PurchaseOrderQueryRq>`,
    bills:             `<BillQueryRq requestID="qall-bill"><ActiveStatus>All</ActiveStatus></BillQueryRq>`,
    payments_received: `<ReceivePaymentQueryRq requestID="qall-pmt"></ReceivePaymentQueryRq>`,
    estimates:         `<EstimateQueryRq requestID="qall-est"><ActiveStatus>All</ActiveStatus></EstimateQueryRq>`,
    terms:             `<TermsQueryRq requestID="qall-terms"><ActiveStatus>All</ActiveStatus></TermsQueryRq>`,
    sales_tax_codes:   `<SalesTaxCodeQueryRq requestID="qall-tax"><ActiveStatus>All</ActiveStatus></SalesTaxCodeQueryRq>`,
    employees:         `<EmployeeQueryRq requestID="qall-emp"><ActiveStatus>All</ActiveStatus></EmployeeQueryRq>`,
  };
  return qbxmlEnvelope("query-all", queryMap[entityType] || "");
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function buildQbXmlRequest(job: any, supabase: any): Promise<string> {
  const { entity_type, entity_id, qb_action, direction } = job;

  // From QB = read/query
  if (direction === "from_qb") {
    return buildQueryAll(entity_type);
  }

  // To QB = write (Add or Mod)
  let record: any;
  let lines: any[] = [];
  let related: any;

  // Fetch the main record
  const { data, error } = await supabase
    .from(entity_type)
    .select("*")
    .eq("id", entity_id)
    .single();

  if (error || !data) throw new Error(`Record not found: ${entity_type}/${entity_id}`);
  record = data;

  // Fetch lines + related entity for transactional records
  if (entity_type === "invoices") {
    const { data: lns } = await supabase
      .from("invoice_lines")
      .select("*, items(qb_list_id)")
      .eq("invoice_id", entity_id)
      .order("sort_order");
    lines = (lns || []).map((l: any) => ({ ...l, qb_list_id: l.items?.qb_list_id }));

    const { data: cust } = await supabase
      .from("customers").select("qb_list_id,name").eq("id", record.customer_id).single();
    related = cust;

    return qbxmlEnvelope(entity_id,
      qb_action === "InvoiceAdd"
        ? buildInvoiceAdd(record, lines, related)
        : buildInvoiceMod(record, lines, related)
    );
  }

  if (entity_type === "sales_orders") {
    const { data: lns } = await supabase
      .from("sales_order_lines")
      .select("*, items(qb_list_id)")
      .eq("sales_order_id", entity_id)
      .order("sort_order");
    lines = (lns || []).map((l: any) => ({ ...l, qb_list_id: l.items?.qb_list_id }));

    const { data: cust } = await supabase
      .from("customers").select("qb_list_id,name").eq("id", record.customer_id).single();
    return qbxmlEnvelope(entity_id, buildSalesOrderAdd(record, lines, cust));
  }

  if (entity_type === "purchase_orders") {
    const { data: lns } = await supabase
      .from("purchase_order_lines")
      .select("*, items(qb_list_id)")
      .eq("purchase_order_id", entity_id)
      .order("sort_order");
    lines = (lns || []).map((l: any) => ({ ...l, qb_list_id: l.items?.qb_list_id }));

    const { data: vend } = await supabase
      .from("vendors").select("qb_list_id,name").eq("id", record.vendor_id).single();
    return qbxmlEnvelope(entity_id, buildPurchaseOrderAdd(record, lines, vend));
  }

  if (entity_type === "bills") {
    const { data: lns } = await supabase
      .from("bill_lines")
      .select("*, items(qb_list_id)")
      .eq("bill_id", entity_id)
      .order("sort_order");
    lines = (lns || []).map((l: any) => ({ ...l, qb_list_id: l.items?.qb_list_id }));

    const { data: vend } = await supabase
      .from("vendors").select("qb_list_id,name").eq("id", record.vendor_id).single();
    return qbxmlEnvelope(entity_id, buildBillAdd(record, lines, vend));
  }

  if (entity_type === "estimates") {
    const { data: lns } = await supabase
      .from("estimate_lines")
      .select("*, items(qb_list_id)")
      .eq("estimate_id", entity_id)
      .order("sort_order");
    lines = (lns || []).map((l: any) => ({ ...l, qb_list_id: l.items?.qb_list_id }));

    const { data: cust } = await supabase
      .from("customers").select("qb_list_id,name").eq("id", record.customer_id).single();
    return qbxmlEnvelope(entity_id, buildEstimateAdd(record, lines, cust));
  }

  if (entity_type === "payments_received") {
    const { data: cust } = await supabase
      .from("customers").select("qb_list_id,name").eq("id", record.customer_id).single();
    return qbxmlEnvelope(entity_id, buildReceivePaymentAdd(record, cust));
  }

  if (entity_type === "customers") {
    return qbxmlEnvelope(entity_id,
      record.qb_list_id ? buildCustomerMod(record) : buildCustomerAdd(record));
  }

  if (entity_type === "vendors") {
    return qbxmlEnvelope(entity_id,
      record.qb_list_id ? buildVendorMod(record) : buildVendorAdd(record));
  }

  if (entity_type === "items") {
    return qbxmlEnvelope(entity_id, buildItemAdd(record));
  }

  throw new Error(`Unsupported entity_type for qbXML build: ${entity_type}`);
}
