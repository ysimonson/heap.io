import zmq
import re

REGEX_TYPE = type(re.compile(''))
CONNECTION_STRING = "ipc:///tmp/heapio"
context = zmq.Context()

try:
    import json
except Exception:
    import simplejson as json

class HeapIO(object):
    def __init__(self):
        self.socket = context.socket(zmq.REQ)
        self.socket.connect(CONNECTION_STRING)

    def _request(self, header, body):
        self.socket.send_multipart([header, json.dumps(body)])
        return self.socket.recv_json()

    def produce(self, key, value):
        response = self._request("produce", {"key": key, "value": value})
        return response.get("error")

    def consume(self, key, timeout):
        if isinstance(key, REGEX_TYPE):
            key_cleaned = key.pattern
            is_complex = True
        else:
            key_cleaned = key
            is_complex = False

        response = self._request("consume", {"key": key_cleaned, "isComplex": is_complex, "timeout": timeout})
        return response.get("error"), response.get("eventId"), response.get("key"), response.get("value")

    def confirm_consume(self, event_id):
        response = self._request("consume/confirm", {"eventId": event_id})
        return response.get("error")