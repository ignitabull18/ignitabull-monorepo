# Neo4j Setup Guide

This guide will help you set up Neo4j for Ignitabull's graph analytics features.

## Overview

Neo4j is used in Ignitabull for:
- **Product Relationship Mapping**: Understanding connections between products, customers, and keywords
- **Customer Journey Analysis**: Tracking how customers discover and purchase products
- **Competitive Intelligence**: Analyzing competitor relationships and market positioning
- **Recommendation Engine**: Graph-based product and keyword recommendations
- **Influencer Network Analysis**: Understanding influencer relationships and campaign performance

## Installation Options

### Option 1: Neo4j Desktop (Recommended for Development)

1. **Download Neo4j Desktop**:
   - Visit [neo4j.com/download](https://neo4j.com/download/)
   - Download Neo4j Desktop for your operating system
   - Install and launch the application

2. **Create a New Database**:
   - Click "New" → "Create a Local Database"
   - Name: `ignitabull-dev`
   - Password: Choose a secure password
   - Version: Use the latest stable version (5.x)

3. **Configure the Database**:
   - Click on your database
   - Go to "Settings" tab
   - Add these configurations:
     ```
     dbms.default_listen_address=0.0.0.0
     dbms.connector.bolt.listen_address=:7687
     dbms.connector.http.listen_address=:7474
     ```

4. **Start the Database**:
   - Click the "Start" button
   - Wait for the status to show "Active"

### Option 2: Docker (Recommended for Production)

1. **Create Docker Compose File**:
   ```yaml
   # docker-compose.neo4j.yml
   version: '3.8'
   services:
     neo4j:
       image: neo4j:5.13-community
       ports:
         - "7474:7474"  # HTTP
         - "7687:7687"  # Bolt
       environment:
         - NEO4J_AUTH=neo4j/your-password-here
         - NEO4J_dbms_memory_pagecache_size=1G
         - NEO4J_dbms_memory_heap_initial__size=1G
         - NEO4J_dbms_memory_heap_max__size=1G
         - NEO4J_dbms_default__database=ignitabull
       volumes:
         - neo4j_data:/data
         - neo4j_logs:/logs
         - neo4j_conf:/conf
   
   volumes:
     neo4j_data:
     neo4j_logs:
     neo4j_conf:
   ```

2. **Start Neo4j**:
   ```bash
   docker-compose -f docker-compose.neo4j.yml up -d
   ```

### Option 3: Neo4j Aura (Cloud)

1. **Sign up for Neo4j Aura**:
   - Visit [neo4j.com/cloud/aura](https://neo4j.com/cloud/aura/)
   - Create a free account
   - Create a new AuraDB Free instance

2. **Get Connection Details**:
   - Note the connection URI (starts with `neo4j+s://`)
   - Save the generated password
   - Download the credentials file

## Environment Configuration

Add these variables to your `.env.local` file:

```bash
# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password-here
NEO4J_DATABASE=ignitabull
NEO4J_MAX_POOL_SIZE=50
NEO4J_MAX_RETRY_TIME=30000
NEO4J_CONNECTION_TIMEOUT=60000
NEO4J_LOG_LEVEL=INFO

# Enable Neo4j features
ENABLE_NEO4J=true
```

### For Neo4j Aura (Cloud):
```bash
# Neo4j Aura Configuration
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-aura-password
NEO4J_DATABASE=neo4j
```

## Verification

1. **Test Connection**:
   ```bash
   # Start your server
   npm run dev
   
   # Check Neo4j health
   curl http://localhost:3001/api/graph/health
   ```

2. **Expected Response**:
   ```json
   {
     "success": true,
     "data": {
       "status": "healthy",
       "latency": 45,
       "nodes": 0,
       "relationships": 0
     }
   }
   ```

3. **Seed Initial Data**:
   ```bash
   curl -X POST http://localhost:3001/api/graph/seed-data
   ```

## Browser Interface

1. **Neo4j Browser** (Desktop/Docker):
   - Open [http://localhost:7474](http://localhost:7474)
   - Login with your credentials
   - Run test query: `MATCH (n) RETURN count(n)`

2. **Neo4j Bloom** (Aura):
   - Access through your Aura console
   - Visual graph exploration interface

## Common Queries

### View All Nodes and Relationships:
```cypher
MATCH (n)-[r]->(m)
RETURN n, r, m
LIMIT 25
```

### Find Products and Their Keywords:
```cypher
MATCH (p:Product)-[r:RANKS_FOR]->(k:Keyword)
RETURN p.title, k.keyword, r.position
ORDER BY r.position
```

### Customer Purchase Patterns:
```cypher
MATCH (c:Customer)-[p:PURCHASED]->(prod:Product)
RETURN c.customerId, collect(prod.title) as purchases
```

### Competitive Analysis:
```cypher
MATCH (p1:Product)-[r:COMPETES_WITH]->(p2:Product)
WHERE p1.category = 'electronics'
RETURN p1.title, p2.title, r.competitionScore
ORDER BY r.competitionScore DESC
```

## Data Model

### Node Types:
- **Product**: Amazon products with ASIN, title, category, price, ratings
- **Customer**: Buyers with segments, locations, purchase history
- **Keyword**: Search terms with volume, difficulty, intent
- **Competitor**: Competing products with market metrics
- **Category**: Product categories with hierarchy
- **Influencer**: Content creators with platform metrics
- **Campaign**: Marketing campaigns with performance data

### Relationship Types:
- **PURCHASED**: Customer → Product (with order details)
- **VIEWED**: Customer → Product (with session data)
- **RANKS_FOR**: Product → Keyword (with position data)
- **COMPETES_WITH**: Product → Product (with competition metrics)
- **BELONGS_TO**: Product → Category (with relevance)
- **SIMILAR_TO**: Product → Product (with similarity score)
- **PROMOTES**: Influencer → Product (with campaign data)
- **TARGETS**: Campaign → Keyword (with performance)

## Performance Optimization

### 1. Memory Configuration:
```bash
# For development (4GB RAM)
NEO4J_dbms_memory_pagecache_size=1G
NEO4J_dbms_memory_heap_initial__size=512M
NEO4J_dbms_memory_heap_max__size=1G

# For production (16GB RAM)
NEO4J_dbms_memory_pagecache_size=4G
NEO4J_dbms_memory_heap_initial__size=2G
NEO4J_dbms_memory_heap_max__size=4G
```

### 2. Index Strategy:
The service automatically creates indexes for:
- Unique constraints on primary keys
- Performance indexes on frequently queried properties
- Composite indexes for complex queries
- Full-text search indexes for product/keyword search

### 3. Query Optimization:
- Use `EXPLAIN` and `PROFILE` for query analysis
- Limit result sets with `LIMIT`
- Use `WITH` for query batching
- Avoid cartesian products

## Monitoring

### Health Checks:
```bash
# Server health with Neo4j status
curl http://localhost:3001/health

# Detailed Neo4j metrics
curl http://localhost:3001/api/graph/summary
```

### Performance Monitoring:
- Response time headers: `X-Neo4j-Response-Time`
- Slow query logging (>5 seconds)
- Connection pool metrics
- Memory usage tracking

## Backup and Restore

### Development Backup:
```bash
# Export database
docker exec neo4j-container neo4j-admin database dump --database=ignitabull --to-path=/tmp/backups/

# Import database
docker exec neo4j-container neo4j-admin database load --from-path=/tmp/backups/ignitabull.dump --database=ignitabull
```

### Production Backup:
- Use Neo4j Aura automated backups
- Schedule regular exports using `neo4j-admin`
- Store backups in encrypted cloud storage

## Troubleshooting

### Common Issues:

1. **Connection Refused**:
   - Check if Neo4j is running: `docker ps` or Neo4j Desktop
   - Verify port 7687 is not blocked
   - Check firewall settings

2. **Authentication Failed**:
   - Verify username/password in environment variables
   - Reset password in Neo4j Desktop or Aura console

3. **Performance Issues**:
   - Increase memory allocation
   - Check for missing indexes
   - Analyze slow queries with `PROFILE`

4. **Memory Errors**:
   - Increase heap size: `NEO4J_dbms_memory_heap_max__size`
   - Optimize queries to use less memory
   - Batch large operations

### Debug Mode:
Set these environment variables for detailed logging:
```bash
NEO4J_LOG_LEVEL=DEBUG
NODE_ENV=development
```

## Security

### Production Security:
1. **Change Default Password**: Never use default `neo4j/neo4j`
2. **Network Security**: Restrict access to port 7687
3. **SSL/TLS**: Use `neo4j+s://` for encrypted connections
4. **User Management**: Create dedicated users with limited permissions
5. **Query Restrictions**: The API only allows read queries through custom endpoints

### Environment Variables:
Store sensitive credentials in:
- `.env.local` (development)
- Environment variables (production)
- Secret management systems (Kubernetes secrets, AWS SSM, etc.)

## Next Steps

1. **Complete Setup**: Follow installation steps for your environment
2. **Test Connection**: Verify health endpoint responds correctly
3. **Explore Data**: Use the seed data endpoint to create sample data
4. **Try Queries**: Use the custom query endpoint to explore relationships
5. **Monitor Performance**: Watch response times and optimize as needed

For additional help, refer to the [Neo4j Documentation](https://neo4j.com/docs/) or create an issue in the repository.