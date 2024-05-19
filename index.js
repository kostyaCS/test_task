require('dotenv').config(); // підключаємо змінні з .env файлу проєкту
const express = require('express'); // ну це фундамент, Express framework для побудови веб застосунків та API
const bodyParser = require('body-parser'); // middleware для обробки тіл запитів
const { Subscription } = require('./models'); // імпортуємо нащу модель підписок з БД
const axios = require('axios'); // http-клієнт для створення http реквестів.
const nodemailer = require('nodemailer'); // бібліотека для надсилання повідомлень
const schedule = require('node-schedule'); // scheduler для відправки повідомлень з певною періодичністю

const app = express(); // ініціалізуємо застосунок, щоб потім специфікувати роути та middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // вказуємо використовувати body-parser, для коректного опрацювання json

const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD'; // API, де можемо отримати поточний курс 

app.get('/api/rate', async (req, res) => { // створюємо get-endpoint, за допомогою якого можна дізнатись курс
  try {
    const response = await axios.get(API_URL); // отримуємо відповідь з api; await, адже маємо дочекатись отримання інформації 
                                                // перед виконанням наступної стрічки
    const rate = response.data.rates.UAH; // конвертуємо в гривні
    res.json(rate);  // відправляємо відповідь як json
  } catch (error) { // хендлимо виключення
    res.status(400).send('Invalid status value');
  }
});

app.post('/api/subscribe', async (req, res) => { // створюємо post-endpoints, за допомогою якого можна підписатись на отримання курсу
  const { email } = req.body; // отримуємо з запиту email коистувача
  try {
    const [_, created] = await Subscription.findOrCreate({ where: { email } }); // перевіряємо, чи є вже даний email в бд
    if (created) { // email новий, додаємо до бд
      res.status(200).send('E-mail added');
    } else { // email вже існує
      res.status(409).send('E-mail already exists');
    }
  } catch (error) { // хендлимо виключення
    res.status(400).send('Invalid status value');
  }
});

const sendDailyUpdates = async () => { // функція, яка надсилає новий курс підписаним користувачам
  try {
    const response = await axios.get(API_URL); 
    const rate = response.data.rates.UAH; // отримуємо поточний курс USD-UAH

    const transporter = nodemailer.createTransport({ // створюємо об'єкт надсилача повідомлень, щоб надсилати повідомлення
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // використовуємо дані з .env файлу, для тесту можна поставити свої
        pass: process.env.GMAIL_PASSWORD
      }
    });

    const subscriptions = await Subscription.findAll(); // отримуємо всіх підписаних користувачів
    subscriptions.forEach(subscription => { // проходимось по кожному, специфікуємо тему та текст
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: subscription.email,
        subject: 'Daily USD to UAH Rate',
        text: `The current USD to UAH exchange rate is: ${rate}`
      };

      transporter.sendMail(mailOptions, (error, info) => { // надсилаємо повідомлення
        if (error) { // хендлимо виключення
          console.error('Error sending email:', error);
        } else { // сповіщуємо про надіслане повідомлення
          console.log('Email sent:', info.response);
        }
      });
    });
  } catch (error) { // хендлимо виключення на будь-якому з етапів await-ів
    console.error('Error fetching exchange rate:', error);
  }
};

schedule.scheduleJob('0 12 * * *', sendDailyUpdates); // відправляємо email щодня о 12:00

const PORT = 3000; // зазначаємо порт, на якому буде виконуватись api
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

