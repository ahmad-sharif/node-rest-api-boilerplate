import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import errorHandler from 'errorhandler';
import morgan from 'morgan';
import helmet from 'helmet';
import sass from 'node-sass-middleware';

import routes from './routes';
import Constants from './config/constants';
import mongooseConnection from './database';
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

let app = express();

const sessionOptions = {
  secret: Constants.security.sessionSecret,
  resave: false,
  saveUninitialized: false, // don't create session until something stored
  store: new MongoStore({
    mongooseConnection,
    ttl: Constants.security.sessionExpiration,
  }),
};

if (Constants.envs.production) {
  app.set('trust proxy', 1); // trust first proxy
  sessionOptions.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionOptions));

// Adds some security best practices
app.use(helmet());
app.use(cors());

// Uncomment if you want to render views
app.set('views', `${__dirname}/views`);
app.set('view engine', 'jade');

app.use(express.static(`${__dirname}/public`));

// Logger
if (!Constants.envs.test) {
  app.use(morgan('dev'));
}

// Properly Decode JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Add all HTTP methods
app.use(methodOverride());

// Mount API routes
app.use('/', routes);

// Only use error handler in development
if (Constants.envs.development) {
  app.use(errorHandler());
}

app.listen(Constants.port, () => {
  // eslint-disable-next-line no-console
  console.log(`
    Port: ${Constants.port}
    Env: ${app.get('env')}
  `);
});

export default app;
