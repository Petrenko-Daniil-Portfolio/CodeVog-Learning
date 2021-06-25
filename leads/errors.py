class RequestLimitError(Exception):
    def __init__(self, message='You have reached requests limit, please wait ', time_to_wait=''):
        self.message = message + time_to_wait
        super.__init__(self.message)
