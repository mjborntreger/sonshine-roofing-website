// Synthetic PostgreSQL execution; never connects to production.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { locationSchema, locationRelations } from './schema.mjs';
const db = new PGlite();
await db.exec(`
CREATE TABLE clients(id uuid PRIMARY KEY,slug text UNIQUE NOT NULL);
CREATE TABLE directus_files(id uuid PRIMARY KEY);
CREATE TABLE directus_relations(many_collection text,many_field text,one_deselect_action text);
CREATE TABLE roofing_service_areas(id uuid PRIMARY KEY,client uuid NOT NULL REFERENCES clients(id),status text NOT NULL DEFAULT 'published',name text,slug text);
CREATE TABLE roofing_projects(id uuid PRIMARY KEY,client uuid NOT NULL REFERENCES clients(id),service_area uuid NOT NULL REFERENCES roofing_service_areas(id));
CREATE TABLE website_pages(id uuid PRIMARY KEY,client uuid NOT NULL REFERENCES clients(id));
CREATE TABLE services(id uuid PRIMARY KEY,client uuid NOT NULL REFERENCES clients(id));
CREATE TABLE navigation_menus(id uuid PRIMARY KEY,client uuid NOT NULL REFERENCES clients(id));
CREATE TABLE reviews(id integer PRIMARY KEY,client uuid REFERENCES clients(id),status text NOT NULL DEFAULT 'published',source text DEFAULT 'Google',rating integer DEFAULT 5,external_id text UNIQUE);
CREATE TABLE faqs(id uuid PRIMARY KEY,client uuid REFERENCES clients(id),website_page uuid REFERENCES website_pages(id),service uuid CONSTRAINT faqs_service_foreign REFERENCES services(id) ON DELETE SET NULL);
CREATE TABLE sponsor_features(id uuid PRIMARY KEY,client uuid REFERENCES clients(id));
CREATE TABLE service_area_sections(id uuid PRIMARY KEY,client uuid REFERENCES clients(id));
CREATE TABLE navigation_items(id uuid PRIMARY KEY,menu uuid,parent uuid,page uuid,service uuid REFERENCES services(id),link_type text NOT NULL DEFAULT 'page');
`);
const existing = new Set(['roofing_service_areas','roofing_projects','reviews','faqs','sponsor_features','service_area_sections','navigation_items']);
const types = { uuid:'uuid',string:'text',text:'text',boolean:'boolean',integer:'integer',timestamp:'timestamptz',json:'jsonb' };
const q = value => `'${String(value).replaceAll("'", "''")}'`;
for (const [collection, fields] of Object.entries(locationSchema)) {
  if (!existing.has(collection)) await db.exec(`CREATE TABLE ${collection} (id uuid PRIMARY KEY)`);
  for (const field of fields) {
    if (field.type === 'alias' || field.field === 'id') continue;
    const defaultValue = field.schema.default_value === undefined ? '' : ` DEFAULT ${q(field.schema.default_value)}`;
    await db.exec(`ALTER TABLE ${collection} ADD COLUMN ${field.field} ${types[field.type]}${defaultValue}${field.schema.is_nullable === false ? ' NOT NULL' : ''}`);
  }
}
for (const edge of locationRelations) await db.exec(`ALTER TABLE ${edge.collection} ADD FOREIGN KEY (${edge.field}) REFERENCES ${edge.related_collection}(id) ON DELETE ${edge.schema.on_delete}`);
const invariantSQL = await readFile(new URL('../../docs/location-model-invariants.sql', import.meta.url), 'utf8');
await db.exec(invariantSQL);
await db.exec(invariantSQL); // Schema/invariant rerun must not duplicate constraints.
const key = number => `00000000-0000-4000-8000-${String(number).padStart(12,'0')}`;
const client = key(1), other = key(2), area = key(10), nearby = key(11), otherArea = key(12), neighborhood = key(20), project = key(30), otherProject = key(31), sponsor = key(40), section = key(50), menu = key(60), faq = key(70), service = key(80);
await db.exec(`
INSERT INTO clients VALUES (${q(client)},'sonshine-roofing'),(${q(other)},'synthetic-other');
INSERT INTO roofing_service_areas(id,client,name,slug) VALUES (${q(area)},${q(client)},'Synthetic Area','synthetic-area'),(${q(nearby)},${q(client)},'Synthetic Nearby','synthetic-nearby'),(${q(otherArea)},${q(other)},'Other Area','other-area');
INSERT INTO roofing_neighborhoods(id,client,name,slug,service_area) VALUES (${q(neighborhood)},${q(client)},'Synthetic Neighborhood','synthetic-neighborhood',${q(area)});
INSERT INTO roofing_projects(id,client,service_area,neighborhood,job_id,zip) VALUES (${q(project)},${q(client)},${q(area)},${q(neighborhood)},'  synthetic-job-one  ','34200');
INSERT INTO roofing_projects(id,client,service_area) VALUES (${q(otherProject)},${q(other)},${q(otherArea)});
INSERT INTO sponsor_features VALUES (${q(sponsor)},${q(client)});
INSERT INTO service_area_sections VALUES (${q(section)},${q(client)});
INSERT INTO navigation_menus VALUES (${q(menu)},${q(client)});
INSERT INTO services VALUES (${q(service)},${q(client)});
INSERT INTO faqs(id,client,service) VALUES (${q(faq)},${q(client)},${q(service)});
`);
assert.equal((await db.query(`SELECT job_id FROM roofing_projects WHERE id=${q(project)}`)).rows[0].job_id, 'synthetic-job-one');
// A retained source photo is independent of coverage-map semantics and lifecycle.
await db.exec(`INSERT INTO directus_files(id) VALUES (${q(key(200))}); UPDATE roofing_neighborhoods SET image=${q(key(200))} WHERE id=${q(neighborhood)}`);
assert.deepEqual((await db.query(`SELECT image,coverage_map FROM roofing_neighborhoods WHERE id=${q(neighborhood)}`)).rows[0], {image:key(200),coverage_map:null});
await db.exec(`DELETE FROM directus_files WHERE id=${q(key(200))}`);
assert.deepEqual((await db.query(`SELECT image,coverage_map FROM roofing_neighborhoods WHERE id=${q(neighborhood)}`)).rows[0], {image:null,coverage_map:null});
let rejected = 0;
async function rejects(sql, codes = ['23503','23505','23514','23502','23001']) {
  await assert.rejects(db.exec(sql), error => { assert.ok(codes.includes(error.code), `Unexpected SQL failure code ${error.code}.`); rejected++; return true; });
}
await rejects(`INSERT INTO roofing_projects(id,client,service_area,job_id) VALUES (${q(key(32))},${q(client)},${q(area)},'synthetic-job-one')`, ['23505']);
const syntheticJobUuid = 'abcdef12-3456-4789-abcd-ef1234567890';
await db.exec(`INSERT INTO roofing_projects(id,client,service_area,job_id,zip) VALUES (${q(key(33))},${q(client)},${q(area)},${q(syntheticJobUuid.toUpperCase())},'34200')`);
assert.equal((await db.query(`SELECT job_id FROM roofing_projects WHERE id=${q(key(33))}`)).rows[0].job_id, syntheticJobUuid);
await rejects(`INSERT INTO roofing_projects(id,client,service_area,job_id,zip) VALUES (${q(key(34))},${q(client)},${q(area)},${q(syntheticJobUuid)},'34200')`, ['23505']);
await rejects(`UPDATE roofing_projects SET job_id=${q(syntheticJobUuid.toUpperCase())} WHERE id=${q(project)}`, ['23505']);
await db.exec(`UPDATE roofing_projects SET job_id=${q(syntheticJobUuid.toUpperCase())} WHERE id=${q(otherProject)}`);
await rejects(`UPDATE roofing_projects SET service_area=${q(otherArea)} WHERE id=${q(project)}`);
await rejects(`UPDATE roofing_projects SET service_area=${q(nearby)} WHERE id=${q(project)}`);
await rejects(`UPDATE roofing_projects SET service_area=NULL WHERE id=${q(project)}`);
await rejects(`UPDATE roofing_neighborhoods SET service_area=${q(nearby)} WHERE id=${q(neighborhood)}`);
await rejects(`UPDATE roofing_neighborhoods SET client=${q(other)} WHERE id=${q(neighborhood)}`);
await rejects(`DELETE FROM roofing_neighborhoods WHERE id=${q(neighborhood)}`);
await rejects(`UPDATE roofing_projects SET zip='not-a-zip' WHERE id=${q(project)}`);
await rejects(`UPDATE roofing_service_areas SET page_status='published' WHERE id=${q(area)}`);
await db.exec(`UPDATE roofing_service_areas SET page_status='published',page_title='Synthetic local roofing',introduction='Synthetic coverage only.',published_at='2020-01-01' WHERE id=${q(area)}`);
await db.exec(`UPDATE roofing_service_areas SET page_status='draft' WHERE id=${q(area)}`);
assert.equal((await db.query(`SELECT service_area FROM roofing_projects WHERE id=${q(project)}`)).rows[0].service_area,area);
await rejects(`INSERT INTO roofing_neighborhoods(id,client,name,slug,service_area) VALUES (${q(key(21))},${q(client)},'','unnamed',${q(area)})`);
await rejects(`UPDATE faqs SET service_area=${q(area)} WHERE id=${q(faq)}`);
await rejects(`DELETE FROM services WHERE id=${q(service)}`);
await db.exec(`INSERT INTO roofing_service_area_neighbors(id,service_area,nearby_area) VALUES (${q(key(90))},${q(area)},${q(nearby)})`);
await rejects(`INSERT INTO roofing_service_area_neighbors(id,service_area,nearby_area) VALUES (${q(key(91))},${q(area)},${q(area)})`);
await rejects(`INSERT INTO roofing_service_area_neighbors(id,service_area,nearby_area) VALUES (${q(key(91))},${q(area)},${q(nearby)})`);
await rejects(`INSERT INTO roofing_service_area_neighbors(id,service_area,nearby_area) VALUES (${q(key(91))},${q(area)},${q(otherArea)})`);
await rejects(`INSERT INTO sponsor_service_areas(id,sponsor,service_area) VALUES (${q(key(92))},${q(sponsor)},${q(otherArea)})`);
await db.exec(`INSERT INTO sponsor_service_areas(id,sponsor,service_area) VALUES (${q(key(92))},${q(sponsor)},${q(area)})`);
await rejects(`INSERT INTO sponsor_service_areas(id,sponsor,service_area) VALUES (${q(key(93))},${q(sponsor)},${q(area)})`);
await rejects(`UPDATE sponsor_features SET client=${q(other)} WHERE id=${q(sponsor)}`);
await rejects(`INSERT INTO service_area_section_areas(id,section,service_area) VALUES (${q(key(94))},${q(section)},${q(otherArea)})`);
await db.exec(`INSERT INTO service_area_section_areas(id,section,service_area) VALUES (${q(key(94))},${q(section)},${q(area)})`);
await rejects(`UPDATE service_area_sections SET client=${q(other)} WHERE id=${q(section)}`);
await rejects(`INSERT INTO navigation_items(id,menu,link_type,service_area) VALUES (${q(key(100))},${q(menu)},'service_area',${q(otherArea)})`);
await db.exec(`INSERT INTO navigation_items(id,menu,link_type,service_area) VALUES (${q(key(100))},${q(menu)},'service_area',${q(area)})`);
await rejects(`UPDATE navigation_menus SET client=${q(other)} WHERE id=${q(menu)}`);
await rejects(`UPDATE roofing_service_areas SET client=${q(other)} WHERE id=${q(area)}`);
await rejects(`INSERT INTO reviews(id,client,service_area) VALUES (1,${q(client)},${q(otherArea)})`);
// Static imported reviews need no fabricated Google resource identity. Editors
// publish or unpublish them, while the same-client association and provenance
// shape remain enforced independently of the unchanged sitewide Google feed.
await db.exec(`INSERT INTO reviews(id,client,service_area,status,external_id) VALUES (1,${q(client)},${q(area)},'draft',NULL);
INSERT INTO reviews(id,client,service_area,external_id) VALUES (2,${q(client)},${q(area)},'synthetic-google-resource');
UPDATE reviews SET status='published' WHERE id=1`);
assert.deepEqual((await db.query('SELECT status,external_id FROM reviews WHERE id=1')).rows[0],{status:'published',external_id:null});
assert.equal((await db.query("SELECT count(*)::integer AS count FROM reviews WHERE status='published' AND source='Google' AND rating=5 AND external_id IS NOT NULL")).rows[0].count,1);
await rejects(`UPDATE reviews SET service_area=${q(otherArea)} WHERE id=1`);
await rejects(`UPDATE reviews SET client=${q(other)} WHERE id=1`);
await db.exec("UPDATE reviews SET status='archived' WHERE id=1");
assert.deepEqual((await db.query('SELECT status,external_id FROM reviews WHERE id=1')).rows[0],{status:'archived',external_id:null});
assert.equal((await db.query('SELECT status FROM reviews WHERE id=2')).rows[0].status,'published');
await db.exec(`UPDATE roofing_projects SET job_id='  ',zip='  ' WHERE id=${q(project)}`);
assert.deepEqual((await db.query(`SELECT job_id,zip FROM roofing_projects WHERE id=${q(project)}`)).rows[0],{job_id:null,zip:null});
await db.exec(`UPDATE roofing_projects SET job_id=${q('\t\n\r ')},zip=${q('\t\n')} WHERE id=${q(project)}`);
assert.deepEqual((await db.query(`SELECT job_id,zip FROM roofing_projects WHERE id=${q(project)}`)).rows[0],{job_id:null,zip:null});
const backfillSQL = await readFile(new URL('./require-sonshine-enrichment.sql', import.meta.url),'utf8');
await assert.rejects(db.exec(backfillSQL), /enrichment is incomplete/u); await db.exec('ROLLBACK');
await db.exec(`UPDATE roofing_projects SET job_id='synthetic-job-one',zip='34200' WHERE id=${q(project)}`);
await db.exec(backfillSQL); await db.exec(backfillSQL);
await rejects(`UPDATE roofing_projects SET job_id=NULL WHERE id=${q(project)}`);
await rejects(`UPDATE roofing_projects SET zip=NULL WHERE id=${q(project)}`);
await rejects(`UPDATE roofing_projects SET job_id=${q('\t\n')} WHERE id=${q(project)}`);
await rejects(`UPDATE roofing_projects SET zip=${q('\t\n')} WHERE id=${q(project)}`);
await db.exec(`UPDATE roofing_projects SET job_id=NULL,zip=NULL WHERE id=${q(otherProject)}`);
// The required rule captures tenant identity; changing a slug cannot evade it.
await db.exec(`UPDATE clients SET slug='renamed-synthetic' WHERE id=${q(client)}`);
await rejects(`UPDATE roofing_projects SET job_id=NULL WHERE id=${q(project)}`);
const verificationSQL = await readFile(new URL('../../docs/verify-location-model.sql', import.meta.url),'utf8');
await db.exec(verificationSQL);
await db.close();
console.log(`PASS: PostgreSQL local SQL apply/rerun/read-only verification, ${rejected} invalid mutations rejected, reference normalization, retained relationships, static review publication/identity/tenant isolation, and scoped post-backfill requirement.`);
