import { sequelize } from '../models';

beforeAll(async () => {
  // Set up test database
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Clean up after tests
  await sequelize.close();
});

beforeEach(async () => {
  // Clean up data between tests
  await sequelize.sync({ force: true });
});
