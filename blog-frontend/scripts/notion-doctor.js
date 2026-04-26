const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('@notionhq/client');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const REQUIRED_PROPERTIES = {
  '名称': 'title',
  Slug: 'rich_text',
  Status: 'select',
  Date: 'date',
  Excerpt: 'rich_text',
  Group: 'select',
};

function maskId(value) {
  const text = String(value || '').replace(/-/g, '');
  if (text.length <= 10) return text ? '<set>' : '<missing>';
  return `${text.slice(0, 6)}...${text.slice(-4)}`;
}

function getPlainText(richText) {
  return (richText || []).map((part) => part.plain_text || '').join('').trim();
}

function describeProperty(property) {
  if (!property) return 'missing';
  if (property.type === 'select') {
    const options = property.select?.options?.map((option) => option.name).join(', ') || 'none';
    return `select options=[${options}]`;
  }
  if (property.type === 'multi_select') {
    const options = property.multi_select?.options?.map((option) => option.name).join(', ') || 'none';
    return `multi_select options=[${options}]`;
  }
  return property.type;
}

async function listAllResults(fetchPage) {
  let cursor;
  const results = [];

  do {
    const response = await fetchPage(cursor);
    results.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return results;
}

async function main() {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  console.log('Notion doctor starting...');
  console.log(`NOTION_TOKEN: ${token ? '<set>' : '<missing>'}`);
  console.log(`NOTION_DATABASE_ID: ${maskId(databaseId)}`);

  if (!token || !databaseId) {
    throw new Error('Missing NOTION_TOKEN or NOTION_DATABASE_ID.');
  }

  const client = new Client({ auth: token });
  const database = await client.databases.retrieve({ database_id: databaseId });
  const title = getPlainText(database.title) || '(untitled database)';

  console.log(`Database title: ${title}`);
  console.log('Required properties:');
  Object.entries(REQUIRED_PROPERTIES).forEach(([name, expectedType]) => {
    const property = database.properties[name];
    const actualType = property?.type || 'missing';
    const status = actualType === expectedType ? 'ok' : `expected ${expectedType}`;
    console.log(`- ${name}: ${describeProperty(property)} (${status})`);
  });

  const allPages = await listAllResults((start_cursor) => client.databases.query({
    database_id: databaseId,
    start_cursor,
    page_size: 100,
  }));

  const publishedPages = await listAllResults((start_cursor) => client.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Status',
      select: {
        equals: 'Published',
      },
    },
    start_cursor,
    page_size: 100,
  }));

  console.log(`Total pages visible to integration: ${allPages.length}`);
  console.log(`Published pages matched by sync filter: ${publishedPages.length}`);

  const samples = allPages.slice(0, 10);
  if (samples.length > 0) {
    console.log('Visible page samples:');
    samples.forEach((page) => {
      const properties = page.properties;
      const sample = {
        id: maskId(page.id),
        title: getPlainText(properties['名称']?.title),
        slug: getPlainText(properties.Slug?.rich_text),
        status: properties.Status?.select?.name || '',
        date: properties.Date?.date?.start || '',
        group: properties.Group?.select?.name || '',
      };
      console.log(`- ${JSON.stringify(sample)}`);
    });
  }

  console.log('Notion doctor complete.');
}

main().catch((error) => {
  console.error(`Notion doctor failed: ${error.body || error.message}`);
  process.exit(1);
});
