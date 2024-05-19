Тестове завданна на Software Engineering School 4.0

## Endpoints
- `GET /api/rate` - Get the current USD to UAH exchange rate.
- `POST /api/subscribe` - Subscribe an email to receive daily updates.

## Running the project
- Clone repo
- Run 'npm i'
- Run `npx sequelize-cli db:migrate`
- Run `npm start`

Alternatively, you can use Docker:

- Build the Docker image: `docker-compose build`
- Start the application: `docker-compose up`

For correct work, update the email and password in the index.js file, as I'm using .env
