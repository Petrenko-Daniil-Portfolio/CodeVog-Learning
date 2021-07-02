class DataSource:
    URL = 'https://www.alphavantage.co/'
    QUERY = 'https://www.alphavantage.co/query?function='
    TIME_SERIES_DAIL_QUERY = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol='
    TIME_SERIES_FX_QUERY = QUERY + 'FX_DAILY&from_symbol={}&to_symbol=EUR&apikey={}'  # this string uses format

