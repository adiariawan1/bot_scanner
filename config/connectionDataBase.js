require('dotenv').config();
const {createClient} = require('@supabase/supabase-js');



const supabase = createClient(process.env.DATABASE_URL, process.env.DATABASE_API);

const saveUser = async (telegramId, username, firstname) =>{
    try {
        const {error} = await supabase
        .from('users')
        .insert([
            {telegram_id: telegramId, username: username, first_name: firstname}
        ],{ onConflict: 'telegram_id' });
        if(error){
            if (error.code === '23505') {
                // Duplicate entry, user already exists
                return;
            }
        }else{
            console.log('✅ User disimpan/terupdate di DB');
        }
    } catch (error) {
        console.error("System error", error.message);
        
    }
}

const getTotalUsers = async () =>{
    try {
        const {count, error} = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
        return count || 0;
    } catch (error) {
        return 0;
    }
}

module.exports = {saveUser, getTotalUsers};