

#### GET /api/experiences/:id
Return the full experience with rounds, coding_problems, technical_questions.


#### PUT /api/experiences/:id
Replace/update the experience and replace rounds with provided rounds (simply deletes old rounds and inserts new ones). Body same shape as POST. Returns updated full experience.


#### DELETE /api/experiences/:id
Deletes experience and cascades.


#### POST /api/experiences/:id/rounds
Add a round to a given experience. Body: `{ round_order, round_name, description }`.


#### PUT /api/rounds/:id
Update round fields. Body: `{ round_order, round_name, description }`.


#### DELETE /api/rounds/:id
Delete a round (and associated problems/questions). Decrements the experience rounds_count.


#### POST /api/rounds/:id/problems
Add a coding problem to a round.
Body example:
```json
{
"title": "Custom problem",
"link": null,
"description": "Explain the problem",
"constraints": "n <= 1000",
"sample_testcases": [{"input":"...","output":"..."}]
}
```


#### POST /api/rounds/:id/questions
Add a technical question to a round.
Body: `{ "question_text": "What is React?", "answer_text": "A JS library..." }`


---


## Notes & tradeoffs
- This example uses raw SQL + `pg` for transparency. For larger projects use an ORM (Prisma/TypeORM/Sequelize) for productivity.
- The `PUT /api/experiences/:id` endpoint deletes and reinserts rounds — simpler to implement, but not ideal if you need to preserve round IDs. If you need patch updates with minimal writes, implement a diffing endpoint.
- SQL uses `sample_testcases` as JSONB to store arrays of testcases.
- Make sure the DB user has privileges to create extension `uuid-ossp` (some hosted DBs restrict it). If `uuid-ossp` is unavailable, switch to `gen_random_uuid()` from `pgcrypto` or generate UUIDs in application code.


---


## Example curl flows


Create experience (short):
```bash
curl -X POST http://localhost:4000/api/experiences \
-H "Content-Type: application/json" \
-d '{"title":"SDE interview","company_name":"Acme","rounds":[]}'
```


Fetch it:
```bash
curl http://localhost:4000/api/experiences
curl http://localhost:4000/api/experiences/<id>
```


---


If you want, I can:
- split this into multiple files suitable for production (controllers/services/routes)
- add authentication (JWT)
- add unit tests and Postman/OpenAPI spec


Otherwise the pasted code above is a complete, working backend. Follow the README steps to run it.
# backend-dev-interview
# backend-dev-interview
