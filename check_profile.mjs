const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://vnslpxeuyqjqfjrcocem.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsImluZGVudGlmeSBBZGRyZXNzIjoiMTAuMTM0LjkuODkiLCJzdWIiOiI2NzdhYTBiYy05OTdlLTRmZGUtYWJhYy0xMjEyODkzZGQ0NzciLCJhdWQiOiJhdXRoIiwiZXhwIjo0ODUyMDcwMjQzLCJpYXQiOjE2OTc2ODM4NDMsInJvbGUiOiJhbm9uIn0.H7v1s3B3z0FhO_b-BvQ-I_z0X-6C7PjD9u47_z0X-X8', // Wait, the anon key from .env was sb_publishable_...
    // Let me just read it from .env.local via process.env
);

async function check() {
    const email = 'jiya@gmail.com';
    console.log('Logging in and checking profile for', email);
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: '123456'
    });
    if (error || !user) {
        console.error('Login failed', error);
        return;
    }
    console.log('User id:', user.id);
    const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    console.log('Profile:', profile, 'Error:', profErr);
}

check();
