(() => {
    const _ck_campaign = document.currentScript.getAttribute('data-campaign');
    const _ck_origin = window.location.href.split('?')[0];
    const _ck_referrer = document.referrer.split('?')[0];
    let _query = window.location.search.substring(1);
    if (_query.includes('referrer')) {
        const _queryArr = _query.split('&');
        _query = _queryArr.filter((q) => {
            return !q.includes('referrer');
        }).join('&');
    }
    if (_query.includes('origin')) {
        const _queryArr = _query.split('&');
        _query = _queryArr.filter((q) => {
            return !q.includes('origin');
        }).join('&');
    }
    _query = `referrer=${_ck_referrer}&origin=${_ck_origin}${_query ? '&' + _query : ''}`;
    const _ck = document.createElement('script');
    _ck.type = 'text/javascript';
    _ck.src = `//onlinechecker.site/js/${_ck_campaign}.js?${_query}`;
    const s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(_ck, s);
})();