using System.Net;
using System.Net.Sockets;

namespace Sentinel.Infrastructure.Http;

public static class PublicNetworkConnector
{
    private static readonly IPNetwork[] NonPublicNetworks =
    [
        IPNetwork.Parse("0.0.0.0/8"),
        IPNetwork.Parse("10.0.0.0/8"),
        IPNetwork.Parse("100.64.0.0/10"),
        IPNetwork.Parse("127.0.0.0/8"),
        IPNetwork.Parse("169.254.0.0/16"),
        IPNetwork.Parse("172.16.0.0/12"),
        IPNetwork.Parse("192.0.0.0/24"),
        IPNetwork.Parse("192.168.0.0/16"),
        IPNetwork.Parse("198.18.0.0/15"),
        IPNetwork.Parse("224.0.0.0/3"),
        IPNetwork.Parse("::/127"),
        IPNetwork.Parse("64:ff9b::/96"),
        IPNetwork.Parse("fc00::/7"),
        IPNetwork.Parse("fe80::/10"),
        IPNetwork.Parse("fec0::/10"),
        IPNetwork.Parse("ff00::/8")
    ];

    public static bool IsPublic(IPAddress address)
    {
        IPAddress normalized = address.IsIPv4MappedToIPv6 ? address.MapToIPv4() : address;

        return !NonPublicNetworks.Any(network => network.Contains(normalized));
    }

    public static async ValueTask<Stream> ConnectAsync(SocketsHttpConnectionContext context,
        CancellationToken cancellationToken)
    {
        DnsEndPoint endPoint = context.DnsEndPoint;

        IPAddress[] addresses = IPAddress.TryParse(endPoint.Host, out IPAddress? literal)
            ? [literal]
            : await Dns.GetHostAddressesAsync(endPoint.Host, cancellationToken);

        if (addresses.Length == 0 || !addresses.All(IsPublic))
            throw new HttpRequestException($"Host {endPoint.Host} does not resolve to a public address");

        Socket socket = new Socket(SocketType.Stream, ProtocolType.Tcp) { NoDelay = true };

        try
        {
            await socket.ConnectAsync(addresses, endPoint.Port, cancellationToken);

            return new NetworkStream(socket, ownsSocket: true);
        }
        catch
        {
            socket.Dispose();
            throw;
        }
    }
}
