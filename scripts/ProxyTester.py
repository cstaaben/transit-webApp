import sys
import socket
import requests
from time import time
from multiprocessing.dummy import Pool as ThreadPool


class Options:

    # request options
    url = "http://tripplanner.spokanetransit.com:8007/RealTimeManager"
    payload = "{\"version\":\"1.1\",\"method\":\"GetStopsForLine\"," \
              "\"params\":{\"reqLineDirIds\":[{\"lineDirId\":52640}]}}"
    headers = {'content-type': 'application/json'}

    # program options
    print_addresses_only = False
    dummy_mode = False
    summarize = False
    num_threads = 100
    verbose_mode = False


class Results:
    num_successful = 0
    time_elapsed = 0


def main():
    args = sys.argv[1:]
    process_arguments(args)
    addresses = get_addresses(args)

    test_proxies(addresses)

    print_summary(len(addresses), Results.num_successful, Results.time_elapsed)


def print_usage(message=""):

    usage = '''usage: ProxyTester [filename.txt] [-a] [-d] [-s] [-t NUM_THREADS] [-v])
optional arguments:
    -h              print this help message and exit
    -a              [only output successful addresses; precludes -s and -v]
    -d              [dummy mode; make the request without proxies]
    -s              [print summary]
    -t NUM_THREADS  [set the amount of threads to use; default = 100]
    -v              [verbose mode]'''
    if message != "":
        print(message)
    print(usage)
    sys.exit(1)


def process_arguments(args):
    if not args or args.count('-h') > 0:
        print_usage()

    if args.count('-d'):
        Options.dummy_mode = True
        Options.num_threads = 1
        Options.summarize = True
        Options.verbose_mode = True
        return

    if args.count('-t') > 0:
        t_index = args.index('-t')
        if not str.isdecimal(args[t_index + 1]):
            print_usage("ERROR: Number of threads not specified after -t flag")
        Options.num_threads = int(args[t_index + 1])

    if args.count('-a') > 0:
        Options.print_addresses_only = True
        return

    if args.count('-s') > 0:
        Options.summarize = True

    if args.count('-v') > 0:
        Options.verbose_mode = True


# process addresses
def get_addresses(args):
    if not Options.dummy_mode:
        f = open(args[0])
        text = f.read()
        addresses = text.split('\n')
    else:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('google.com', 0))
        addresses = [s.getsockname()[0]]
    return addresses


def test_proxies(addresses):
    # Make the Pool of workers
    pool = ThreadPool(Options.num_threads)

    start_time = time()

    # Open the urls in their own threads
    results = pool.map(make_request, addresses)

    # close the pool and wait for the work to finish
    pool.close()
    pool.join()

    # calculate stats
    end_time = time()
    Results.time_elapsed = end_time - start_time
    Results.num_successful = len(results) - results.count(None)


def print_summary(num_addresses, num_successful, time_elapsed):
    if not Options.summarize or Options.print_addresses_only:
        return

    print()
    print('addresses tested:\t' + str(num_addresses))
    print('successful addresses:\t' + str(num_successful))
    print('time elapsed:\t\t' + str(time_elapsed))


def make_request(address):
    if len(address) < 7 or len(address) > 15:
        if len(address) != 0 and not Options.print_addresses_only:
            print('invalid address: ' + address)
        return

    proxy_dict = False
    if not Options.dummy_mode:
        proxy_dict = {
            "http": "http://" + address + ":80"
        }

    start_time = time()

    try:
        # send request
        # timeout just below default TCP retransmission threshold
        response = requests.request("POST",
                                    Options.url,
                                    data=Options.payload,
                                    headers=Options.headers,
                                    proxies=proxy_dict,
                                    timeout=2.9)

    except requests.ConnectTimeout:
        if Options.verbose_mode:
            print(address + "\t\t" + str(requests.ConnectTimeout))
    except requests.ReadTimeout:
        if Options.verbose_mode:
            print(address + "\t\t" + str(requests.ReadTimeout))
    except requests.ConnectionError:
        if Options.verbose_mode:
            print(address + "\t\t" + str(requests.ConnectionError))
    except Exception:
        if Options.verbose_mode:
            print(str(Exception))
    else:
        end_time = time()
        time_elapsed = end_time - start_time
        if response.status_code == 200:
            if Options.print_addresses_only:
                print(address)
            else:
                print(address + "\t\t" + str(time_elapsed) + "s")
            return address
        else:
            if Options.verbose_mode:
                print(address + "\t\tstatus code " + response.status_code)
    return None


if __name__ == "__main__":
    main()
