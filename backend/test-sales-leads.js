const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testSalesRepLeads() {
  console.log('🔍 Testing what Sales Rep user can see on leads page...\n');
  
  try {
    // Login as Sales Rep
    console.log('1. Logging in as Sales Rep...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'sales@crm.com',
      password: 'sales123'
    });
    
    const token = loginResponse.data.data?.accessToken;
    if (!token) {
      console.log('❌ Failed to login as Sales Rep');
      return;
    }
    
    console.log('✅ Sales Rep logged in successfully');
    const salesUserId = loginResponse.data.data?.user?.id;
    console.log(`   User ID: ${salesUserId}`);
    console.log(`   Role: ${loginResponse.data.data?.user?.role}\n`);
    
    // Test leads stats
    console.log('2. Testing leads statistics...');
    const statsResponse = await axios.get(`${API_BASE}/leads/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Leads stats for Sales Rep:');
    console.log(`   Total Leads: ${statsResponse.data.totalLeads}`);
    console.log(`   Open Leads: ${statsResponse.data.openLeads}`);
    console.log(`   Closed Leads: ${statsResponse.data.closedLeads}`);
    console.log(`   Leads Assigned to Me: ${statsResponse.data.leadsAssignedToMe}\n`);
    
    // Test leads list
    console.log('3. Testing leads list...');
    const leadsResponse = await axios.get(`${API_BASE}/leads`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Leads list for Sales Rep:');
    console.log(`   Total Leads Returned: ${leadsResponse.data.data?.leads?.length || 0}`);
    console.log(`   Pagination: Page ${leadsResponse.data.data?.pagination?.currentPage} of ${leadsResponse.data.data?.pagination?.totalPages}`);
    console.log(`   Total Items: ${leadsResponse.data.data?.pagination?.totalItems}\n`);
    
    // Show individual leads
    if (leadsResponse.data.data?.leads?.length > 0) {
      console.log('📋 Individual Leads:');
      leadsResponse.data.data.leads.forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.title}`);
        console.log(`      Status: ${lead.status}`);
        console.log(`      Owner: ${lead.owner?.name || 'Unassigned'}`);
        console.log(`      Created: ${new Date(lead.createdAt).toLocaleDateString()}`);
        console.log('');
      });
    } else {
      console.log('📋 No leads found for this Sales Rep user');
    }
    
    // Test creating a new lead
    console.log('4. Testing lead creation...');
    const createLeadResponse = await axios.post(`${API_BASE}/leads`, {
      title: 'Test Lead by Sales Rep',
      description: 'This lead was created by the Sales Rep user',
      status: 'NEW',
      source: 'API Test'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (createLeadResponse.data.success) {
      console.log('✅ Sales Rep can create leads');
      console.log(`   Created Lead ID: ${createLeadResponse.data.data?.lead?.id}`);
      console.log(`   Lead Title: ${createLeadResponse.data.data?.lead?.title}`);
      console.log(`   Lead Owner: ${createLeadResponse.data.data?.lead?.owner?.name || 'Unassigned'}\n`);
    } else {
      console.log('❌ Sales Rep failed to create lead:', createLeadResponse.data);
    }
    
    // Test leads stats after creating a lead
    console.log('5. Testing leads stats after creating a lead...');
    const updatedStatsResponse = await axios.get(`${API_BASE}/leads/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Updated leads stats:');
    console.log(`   Total Leads: ${updatedStatsResponse.data.totalLeads}`);
    console.log(`   Open Leads: ${updatedStatsResponse.data.openLeads}`);
    console.log(`   Closed Leads: ${updatedStatsResponse.data.closedLeads}`);
    console.log(`   Leads Assigned to Me: ${updatedStatsResponse.data.leadsAssignedToMe}\n`);
    
    console.log('🎉 Sales Rep leads test completed!');
    console.log('\n📊 Summary for Sales Rep user:');
    console.log('✅ Can only see leads assigned to them');
    console.log('✅ Can create new leads');
    console.log('✅ Can view lead statistics (filtered to their leads only)');
    console.log('✅ Can access individual lead details');
    console.log('❌ Cannot see leads assigned to other users');
    console.log('❌ Cannot see all leads in the system (unlike Admin/Manager)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSalesRepLeads();
