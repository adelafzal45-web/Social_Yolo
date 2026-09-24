const { Inject } = require('@nestjs/common');

function getRepositoryToken(entity, dataSource) {
  if (entity === null || entity === undefined) {
    return 'Repository';
  }
  if (typeof entity === 'string') {
    return `${entity}Repository`;
  }
  return `${entity.name}Repository`;
}

function getDataSourceToken(dataSource) {
  return 'DataSource';
}

module.exports = {
  InjectRepository: (entity, dataSource) => Inject(getRepositoryToken(entity, dataSource)),
  InjectDataSource: (dataSource) => Inject(getDataSourceToken(dataSource)),
  InjectEntityManager: () => Inject('EntityManager'),
  getRepositoryToken,
  getDataSourceToken,
  TypeOrmModule: {
    forRoot: () => ({ module: class TypeOrmModule {} }),
    forRootAsync: () => ({ module: class TypeOrmModule {} }),
    forFeature: () => ({ module: class TypeOrmModule {} }),
  },
};
