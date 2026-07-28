import fs from "node:fs/promises";
import path from "node:path";

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else quoted = false;
      } else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0].map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, "").trim() : header.trim(),
  );
  return rows
    .slice(1)
    .filter((values) => values.some((value) => value !== ""))
    .map((values) =>
      Object.fromEntries(
        headers.map((header, index) => [header, values[index] ?? ""]),
      ),
    );
};

const isAffiliateUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "s.shopee.co.th";
  } catch {
    return false;
  }
};

export async function createAffiliateV2Runner({
  tab,
  queuePath,
  statePath,
  downloadDir,
}) {
  const queue = JSON.parse(await fs.readFile(queuePath, "utf8"));
  let state = {
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: "Shopee Affiliate Product Offer UI",
    link_policy: "affiliate_offer_link_only",
    queries: [],
    products: {},
  };
  try {
    const restored = JSON.parse(await fs.readFile(statePath, "utf8"));
    if (Array.isArray(restored.queries) && restored.products) state = restored;
  } catch {
    // A missing state file is a valid first run.
  }

  const save = async () => {
    state.updated_at = new Date().toISOString();
    await fs.writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  };

  const resetStaleSelection = async () => {
    const selectedCount = await tab.playwright.evaluate(() => {
      const labels = [...document.querySelectorAll("*")]
        .map((element) => (element.textContent || "").trim())
        .filter((value) => /^\d+\s*\/\s*100 selected$/.test(value));
      const match = labels[labels.length - 1]?.match(/^(\d+)/);
      return match ? Number(match[1]) : 0;
    });
    if (selectedCount > 0) {
      await tab.reload();
      await tab.playwright.waitForTimeout(1500);
      const snapshot = await tab.playwright.domSnapshot();
      if (!snapshot.includes('textbox "Search for all Shopee Products"')) {
        throw new Error("Product Offer search box missing after selection reset");
      }
    }
  };

  const downloadBatch = async () => {
    const batch = tab.playwright.getByRole("button", {
      name: "Batch Get Link",
      exact: true,
    });
    const batchCount = await batch.count();
    if (batchCount !== 1) throw new Error(`batch_count_${batchCount}`);
    if (!(await batch.isEnabled())) throw new Error("batch_disabled");
    await batch.click();

    const dialog = tab.playwright.getByRole("dialog");
    const dialogCount = await dialog.count();
    if (dialogCount !== 1) throw new Error(`dialog_count_${dialogCount}`);
    await dialog.waitFor({ state: "visible", timeoutMs: 10000 });
    const getLink = dialog.getByRole("button", {
      name: "Get Link",
      exact: true,
    });
    const getLinkCount = await getLink.count();
    if (getLinkCount !== 1) throw new Error(`get_link_count_${getLinkCount}`);

    const before = new Set(
      (await fs.readdir(downloadDir)).filter((name) =>
        /^BatchProductLinks.*\.csv$/i.test(name),
      ),
    );
    const startedAt = Date.now();
    await getLink.click();
    let downloadedName = "";
    for (let poll = 0; poll < 90 && !downloadedName; poll += 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const names = (await fs.readdir(downloadDir)).filter((name) =>
        /^BatchProductLinks.*\.csv$/i.test(name),
      );
      for (const name of names) {
        if (before.has(name)) continue;
        try {
          const stat = await fs.stat(path.join(downloadDir, name));
          if (stat.size > 0 && stat.mtimeMs >= startedAt - 1000) {
            downloadedName = name;
            break;
          }
        } catch {
          // A partial download may appear briefly; continue polling.
        }
      }
    }
    if (!downloadedName) throw new Error("download_not_found");
    const downloadedPath = path.join(downloadDir, downloadedName);
    const rows = parseCsv(await fs.readFile(downloadedPath, "utf8"));
    await fs.unlink(downloadedPath);
    return rows;
  };

  const processGroup = async (group) => {
    await resetStaleSelection();
    const selected = {};
    const queryStats = [];

    for (const planRow of group) {
      const search = tab.playwright.getByRole("textbox", {
        name: "Search for all Shopee Products",
        exact: true,
      });
      const searchCount = await search.count();
      if (searchCount !== 1) {
        throw new Error(`search_count_${searchCount}_${planRow.query}`);
      }
      await search.fill(planRow.query);
      await search.press("Enter");
      await tab.playwright.waitForTimeout(1600);

      const cards = await tab.playwright.evaluate(() =>
        [...document.querySelectorAll('a[href*="/offer/product_offer/"]')]
          .slice(0, 20)
          .map((anchor) => {
            const match = (anchor.getAttribute("href") || "").match(
              /product_offer\/(\d+)/,
            );
            const image = anchor.querySelector("img");
            return {
              item_id: match ? match[1] : "",
              image_url: image
                ? image.currentSrc ||
                  image.getAttribute("src") ||
                  image.getAttribute("data-src") ||
                  ""
                : "",
            };
          })
          .filter((card) => card.item_id),
      );

      queryStats.push({
        query: planRow.query,
        categories: planRow.categories,
        source_row_count: planRow.source_row_count,
        source_row_ids: planRow.source_row_ids,
        affiliate_fit_counts: planRow.affiliate_fit_counts,
        product_count: cards.length,
      });
      if (!cards.length) continue;

      for (const card of cards) {
        selected[card.item_id] ??= {
          item_id: card.item_id,
          image_url: card.image_url,
          query_data: [],
        };
        if (!selected[card.item_id].image_url && card.image_url) {
          selected[card.item_id].image_url = card.image_url;
        }
        selected[card.item_id].query_data.push({
          query: planRow.query,
          categories: planRow.categories,
          source_row_ids: planRow.source_row_ids,
        });
      }

      const selectAll = tab.playwright.getByRole("checkbox", {
        name: "Select all products on this page",
        exact: true,
      });
      const selectCount = await selectAll.count();
      if (selectCount !== 1) {
        throw new Error(`select_count_${selectCount}_${planRow.query}`);
      }
      let checked = await selectAll.evaluate((element) =>
        Boolean(element.checked),
      );
      if (!checked) {
        const label = tab.playwright.getByText(
          "Select all products on this page",
          { exact: true },
        );
        const labelCount = await label.count();
        if (labelCount !== 1) {
          throw new Error(`select_label_count_${labelCount}_${planRow.query}`);
        }
        await label.click();
        checked = await selectAll.evaluate((element) =>
          Boolean(element.checked),
        );
        if (!checked) throw new Error(`select_failed_${planRow.query}`);
      }
    }

    const csvRows = Object.keys(selected).length ? await downloadBatch() : [];
    let affiliateRows = 0;
    let invalidRows = 0;
    for (const csvRow of csvRows) {
      const id = String(csvRow["Item Id"] || "").trim();
      const affiliateUrl = String(csvRow["Offer Link"] || "").trim();
      if (!id || !isAffiliateUrl(affiliateUrl)) {
        invalidRows += 1;
        continue;
      }
      const metadata = selected[id] ?? { image_url: "", query_data: [] };
      const product = state.products[id] ?? {
        item_id: id,
        title: String(csvRow["Item Name"] || "").trim(),
        price: String(csvRow.Price || "").trim(),
        sales: String(csvRow.Sales || "").trim(),
        shop_name: String(csvRow["Shop Name"] || "").trim(),
        commission_rate: String(csvRow["Commission Rate"] || "").trim(),
        commission: String(csvRow.Commission || "").trim(),
        affiliate_url: affiliateUrl,
        image_url: metadata.image_url || "",
        search_queries: [],
        categories: [],
        source_row_ids: [],
        source: "Shopee Affiliate Product Offer",
      };
      product.affiliate_url = affiliateUrl;
      if (!product.image_url && metadata.image_url) {
        product.image_url = metadata.image_url;
      }
      for (const queryData of metadata.query_data) {
        if (!product.search_queries.includes(queryData.query)) {
          product.search_queries.push(queryData.query);
        }
        for (const category of queryData.categories) {
          if (!product.categories.includes(category)) {
            product.categories.push(category);
          }
        }
        for (const rowId of queryData.source_row_ids) {
          if (!product.source_row_ids.includes(rowId)) {
            product.source_row_ids.push(rowId);
          }
        }
      }
      state.products[id] = product;
      affiliateRows += 1;
    }

    for (const queryStat of queryStats) {
      state.queries = state.queries.filter(
        (entry) => entry.query !== queryStat.query,
      );
      state.queries.push({
        ...queryStat,
        status: queryStat.product_count ? "ok" : "no_results",
        processed_at: new Date().toISOString(),
      });
    }
    await save();
    return {
      queries: group.length,
      query_stats: queryStats.map(({ query, product_count }) => ({
        query,
        count: product_count,
      })),
      selected: Object.keys(selected).length,
      affiliate_rows: affiliateRows,
      invalid_rows: invalidRows,
      completed: state.queries.length,
      remaining: queue.length - state.queries.length,
      products: Object.keys(state.products).length,
    };
  };

  return {
    progress() {
      return {
        queue: queue.length,
        completed: state.queries.length,
        remaining: queue.length - state.queries.length,
        products: Object.keys(state.products).length,
      };
    },
    async nextGroup() {
      const remaining = queue.filter(
        (row) =>
          !state.queries.some(
            (entry) =>
              entry.query === row.query &&
              (entry.status === "ok" || entry.status === "no_results"),
          ),
      );
      const group = remaining.slice(0, 5);
      if (!group.length) return { ...this.progress(), done: true };
      return processGroup(group);
    },
  };
}

