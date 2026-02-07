import { supabase } from './src/db/supabase';

const checkDB = async () => {
    console.log('Checking database connection...');
    try {
        const { count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Database Check Failed:', error);
        } else {
            console.log('Database Connected Successfully!');
            console.log('User count:', count);
        }
    } catch (err) {
        console.error('Unexpected Error:', err);
    }
};

checkDB();
