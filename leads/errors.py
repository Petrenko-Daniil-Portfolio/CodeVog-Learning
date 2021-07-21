class RequestLimitError(Exception):
    def __init__(self, message='You have reached requests limit, please wait ', time_to_wait=''):
        self.message = message + time_to_wait
        super.__init__(self.message)


class DuplicateDatesInInstrumentTimeSeries(Exception):
    def __init__(self, message='You have duplicate dates in {0} time series', instrument='instruments'):
        self.message = message.format(instrument)