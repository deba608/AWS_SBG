export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  lead?: boolean;
  email?: string;
  linkedin?: string;
}

/** Leadership — Captain, President, Secretary */
export const teamLeads: TeamMember[] = [
  {
    id: "pratik-samal",
    name: "Pratik Samal",
    role: "Captain",
    bio: "Leads the AWS Cloud Club, steering club direction and fostering a culture of cloud-first building.",
    lead: true,
  },
  {
    id: "manas-ranjan-diskhit",
    name: "Manas Ranjan Diskhit",
    role: "President",
    bio: "Drives overall club strategy, partnerships and community growth across campus.",
    lead: true,
  },
  {
    id: "debashish-pradhan",
    name: "Debashish Pradhan",
    role: "Secretary",
    bio: "Manages club operations, communications and documentation to keep everything running smoothly.",
    lead: true,
  },
  {
    id: "abhash-dash",
    name: "Abhash Dash",
    role: "Tech Executive",
    bio: "Oversees technical initiatives, tooling and infrastructure for the club's projects.",
    lead: true,
  },
];

/** Domain leads & co-leads */
export const domainLeads: TeamMember[] = [
  // Web Dev
  {
    id: "satya-anurag-das",
    name: "Satya Anurag Das",
    role: "Web Dev Lead",
    bio: "Leads frontend and full-stack web development projects and workshops.",
  },
  {
    id: "ankit-biswal",
    name: "Ankit Biswal",
    role: "Web Dev Co-Lead",
    bio: "Supports web dev initiatives and helps ship community-driven web projects.",
  },
  // AI-ML
  {
    id: "armish-kumar",
    name: "Armish Kumar",
    role: "AI-ML Lead",
    bio: "Heads AI/ML workshops, model experiments and SageMaker deep-dives.",
  },
  {
    id: "byapti-baibhabi-senapati",
    name: "Byapti Baibhabi Senapati",
    role: "AI-ML Co-Lead",
    bio: "Co-leads machine learning sessions and guides newcomers through AI workflows.",
  },
  {
    id: "swapna-ranjan-sahoo",
    name: "Swapna Ranjan Sahoo",
    role: "AI-ML Co-Lead",
    bio: "Contributes to AI-ML curriculum design and hands-on lab facilitation.",
  },
  // Cloud
  {
    id: "chintamani-mohanta",
    name: "Chintamani Mohanta",
    role: "Cloud Lead",
    bio: "Leads cloud architecture workshops, certification prep and AWS lab sessions.",
  },
  {
    id: "abhipsa-sahu",
    name: "Abhipsa Sahu",
    role: "Cloud Co-Lead",
    bio: "Supports cloud learning paths and helps members get hands-on with AWS services.",
  },
  // Cybersecurity
  {
    id: "aditya-padhihari",
    name: "Aditya Padhihari",
    role: "Cybersecurity Lead",
    bio: "Leads security workshops, CTFs and awareness sessions for the community.",
  },
  {
    id: "astha-ranjan-pradhan",
    name: "Astha Ranjan Pradhan",
    role: "Cybersecurity Co-Lead",
    bio: "Helps organize security-focused events and educational content.",
  },
  // Android
  {
    id: "debashis-sahoo",
    name: "Debashis Sahoo",
    role: "Android Lead",
    bio: "Leads mobile development workshops and Android project initiatives.",
  },
  {
    id: "ritika-kukreja",
    name: "Ritika Kukreja",
    role: "Android Co-Lead",
    bio: "Co-leads Android sessions and supports mobile app development projects.",
  },
  // Data Analysis
  {
    id: "somesh-sahoo",
    name: "Somesh Sahoo",
    role: "Data Analysis Lead",
    bio: "Heads data analysis workshops and teaches data-driven decision making.",
  },
  {
    id: "balaji-laxmi-pati",
    name: "Balaji Laxmi Pati",
    role: "Data Analysis Co-Lead",
    bio: "Supports data analysis sessions and mentors members in analytics tools.",
  },
  {
    id: "jayprakash-muduli",
    name: "Jayprakash Muduli",
    role: "Data Analysis Co-Lead",
    bio: "Assists with data workshops and community analytics initiatives.",
  },
  // IoT
  {
    id: "jagdish-sahu",
    name: "Jagdish Sahu",
    role: "IoT Lead",
    bio: "Leads Internet of Things projects and hardware-meets-cloud workshops.",
  },
  {
    id: "amit-kumar-sahoo",
    name: "Amit Kumar Sahoo",
    role: "IoT Co-Lead",
    bio: "Supports IoT initiatives connecting embedded systems with AWS cloud services.",
  },
  // IIoT
  {
    id: "chandra-sekhar-behera",
    name: "Chandra Sekhar Behera",
    role: "IIoT Lead",
    bio: "Leads Industrial IoT projects bridging manufacturing and cloud technology.",
  },
  {
    id: "subhasish-panda",
    name: "Subhasish Panda",
    role: "IIoT Co-Lead",
    bio: "Co-leads Industrial IoT sessions and explores edge computing use cases.",
  },
];

/** Operations — Events, Social Media, PR, Visual Media */
export const opsTeam: TeamMember[] = [
  {
    id: "ayush-dash",
    name: "Ayush Dash",
    role: "Events Lead",
    bio: "Plans and executes all club events, from workshops to flagship community days.",
  },
  {
    id: "swaymshree-pankaj-nath",
    name: "Swaymshree Pankaj Nath",
    role: "Events Co-Lead",
    bio: "Assists with event logistics, venue coordination and on-day execution.",
  },
  {
    id: "sairaj-dalabehera",
    name: "Sairaj Dalabehera",
    role: "Events Co-Lead",
    bio: "Supports event planning and helps coordinate speakers and schedules.",
  },
  {
    id: "bibhuprasad-samal",
    name: "Bibhuprasad Samal",
    role: "Social Media Lead",
    bio: "Manages the club's social presence across Instagram, LinkedIn and WhatsApp.",
  },
  {
    id: "samparna-rout",
    name: "Samparna Rout",
    role: "Social Media Co-Lead",
    bio: "Creates content and helps grow the community's online engagement.",
  },
  {
    id: "ashish-abhisek-panda",
    name: "Ashish Abhisek Panda",
    role: "PR Lead",
    bio: "Handles public relations, campus outreach and external communications.",
  },
  {
    id: "riya-singh",
    name: "Riya Singh",
    role: "PR Co-Lead",
    bio: "Supports PR activities and helps build partnerships with other communities.",
  },
  {
    id: "preeti-priyadarshini",
    name: "Preeti Priyadarshini",
    role: "PR Co-Lead",
    bio: "Assists with outreach communications and stakeholder engagement.",
  },
  {
    id: "priyambada-arya",
    name: "Priyambada Arya",
    role: "Visual Media Lead",
    bio: "Owns the club's visual identity — posters, event creatives and brand assets.",
  },
];

/** Coordinators */
export const coordinators: TeamMember[] = [
  {
    id: "ankita-jena",
    name: "Ankita Jena",
    role: "Co-ordinator",
    bio: "Coordinates cross-team activities and ensures smooth collaboration.",
  },
  {
    id: "aurobind-bhuyan",
    name: "Aurobind Bhuyan",
    role: "Co-ordinator",
    bio: "Helps coordinate between technical domains and club operations.",
  },
  {
    id: "debiprasad-mohanta",
    name: "Debiprasad Mohanta",
    role: "Co-ordinator",
    bio: "Supports event coordination and inter-team communication.",
  },
  {
    id: "sambit-maharana",
    name: "Sambit Maharana",
    role: "Co-ordinator",
    bio: "Assists with logistics, member onboarding and day-to-day club operations.",
  },
];

/** Flat list of every member for convenience */
export const allMembers: TeamMember[] = [
  ...teamLeads,
  ...domainLeads,
  ...opsTeam,
  ...coordinators,
];
