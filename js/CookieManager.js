const _COOKIE_DURATION = 30; //cookies last 30 days

export default class CookieManager{
    static saveCookie(cookie, name) {
        //Save favorites array to cookie
        if ($.isEmptyObject(cookie)) {
            $.cookie(name, "", -1);	//kill the cookie
        } else {
            $.cookie(name, JSON.stringify(cookie), {expires: _COOKIE_DURATION});
        }
    }

    static loadCookie(name) {
        let cookie = $.cookie(name);
        if ($.isEmptyObject(cookie)) {
            return undefined;
        } else {
            return $.parseJSON(cookie);
        }
    }
}
