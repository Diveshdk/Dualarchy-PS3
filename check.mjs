import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://vnslpxeuyqjqfjrcocem.supabase.co',
    'sb_publishable_ikG0WnLvCTkVUxhngCIZCQ_kwMGiJ-l'
);

async function check() {
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email: 'jiya@gmail.com',
        password: '123456'
    });
    if (error || !user) {
        console.error('Login failed', error);
        return;
    }
    console.log('User id:', user.id);
    const { data: profile, error: profErr } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    if (profErr && profErr.code === 'PGRST116') {
        console.log('Profile missing. Attempting to create one...');
        const { data: newProfile, error: insertErr } = await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            full_name: 'Jiya Test',
            role: 'owner' // or sales, giving owner so they can see everything
        }).select().single();

        if (insertErr) {
            console.error('Failed to create profile:', insertErr);
        } else {
            console.log('Successfully created profile:', newProfile);
        }
    } else {
        console.log('Profile:', profile, 'Error:', profErr);
    }
}
check();
