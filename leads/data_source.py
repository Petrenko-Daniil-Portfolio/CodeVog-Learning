class DataSource:
    """Class to store constants for remote data source API requests

    :param str URL: domain of data source
    :param str QUERY: base part of any request to data source
    :param str TIME_SERIES_DAIL_QUERY: url to GET time series daily. Has 2 {} to use .format().
                The first one is symbol of the instrument, the second is apikey
    :param str TIME_SERIES_FX_QUERY: url to GET fx daily. Has 2 {} to use .format().
                The first one is symbol of fin instrument, the second is its apikey
    """
    URL = 'https://www.alphavantage.co/'
    QUERY = URL + 'query?function='
    TIME_SERIES_DAIL_QUERY = QUERY + 'TIME_SERIES_DAILY&symbol={}&apikey={}'
    TIME_SERIES_FX_QUERY = QUERY + 'FX_DAILY&from_symbol={}&to_symbol=EUR&apikey={}'  # this string uses format

