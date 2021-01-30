# Copyright 2013-2021 Sylvain Cadilhac (NetFishers)
# 
# This file is part of Netshot.
# 
# Netshot is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# Netshot is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with Netshot.  If not, see <http://www.gnu.org/licenses/>.

import re

class result_option:
    NONCONFORMING = "NONCONFORMING"
    NOTAPPLICABLE = "NOTAPPLICABLE"
    CONFORMING = "CONFORMING"

UNDERSCORE_RE = re.compile(r"([^\-_\s])[\-_\s]+([^\-_\s])")


class Device:
    def __init__(self, _device_helper):
        self._device_helper = _device_helper

    def _camelize(self, s):
        return "".join(
            [
                s[0].lower() if not s[:2].isupper() else s[0],
                UNDERSCORE_RE.sub(
                    lambda m: m.group(1) + m.group(2).upper(), s[1:]
                ),
            ]
        )

    def get(self, key, id = None):
        if not isinstance(key, str):
            raise TypeError("Invalid key type in get")
        camelized_key = self._camelize(key)
        if id is None:
            return self._device_helper.get(camelized_key)
        else:
            return self._device_helper.get(camelized_key, id)

    def nslookup(host):
        if not isinstance(host, str):
            raise TypeError("Invalid key type in get")
        _device_helper.nslookup(host)


def _check(_device_helper):
    global debug
    def debug(message):
        nonlocal _device_helper
        if isinstance(message, str):
            _device_helper.debug(message)
    device = Device(_device_helper)

    result = check(device=device)
    if isinstance(result, str):
        return {'result': result, 'comment': ""}
    return result
