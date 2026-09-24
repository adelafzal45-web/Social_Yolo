module.exports = {
  InjectRepository: () => () => {},
  InjectDataSource: () => () => {},
  getRepositoryToken: (entity) =>
    typeof entity === 'string' ? entity : `${entity.name}Repository`,
  getDataSourceToken: () => 'DataSource',
  TypeOrmModule: {
    forRoot: () => ({ module: class TypeOrmModule {} }),
    forRootAsync: () => ({ module: class TypeOrmModule {} }),
    forFeature: () => ({ module: class TypeOrmModule {} }),
  },
};
